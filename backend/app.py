# app.py (production-ready for Render + Gunicorn)
import os
import sys
import logging
import atexit
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.events import EVENT_JOB_ERROR, JobExecutionEvent
from pytz import utc
from supabase import create_client, Client

# load local .env for local dev (Render will use dashboard env vars)
load_dotenv()

# ----- Configuration from env -----
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_TABLE = os.getenv("SUPABASE_TABLE", "trade")  # change to "trades" if your table is plural
START_SCHEDULER_ENV = os.getenv("START_SCHEDULER", "").lower()  # "true" to force start under gunicorn
SYNC_INTERVAL_MINUTES = int(os.getenv("SYNC_INTERVAL_MINUTES", "5"))

# ----- Logging config -----
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("backend")

# ----- Import Robinhood client (your existing module) -----
# Make sure robin_client.py is in the same directory and contains:
#  - get_portfolio_positions()
#  - get_portfolio_performance(...)
#  - get_all_trades_for_sync()
try:
    from robin_client import (
        get_portfolio_positions,
        get_portfolio_performance,
        get_all_trades_for_sync,
    )
except Exception as e:
    logger.exception("Failed to import robin_client: %s", e)
    raise

# ----- Validate Supabase config -----
if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("SUPABASE_URL and SUPABASE_KEY must be set in environment variables.")
    # Do not raise here to allow local dev to proceed if desired, but many features will break.
    # Consider raising in strict environments.

# ----- Create Supabase client -----
supabase: Client = None
try:
    if SUPABASE_URL and SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized.")
    else:
        logger.warning("Supabase client NOT initialized (missing env vars).")
except Exception as e:
    logger.exception("Failed to create Supabase client: %s", e)
    supabase = None

# ----- Flask app -----
app = Flask(__name__)
CORS(app)

# ----- Scheduler -----
scheduler = BackgroundScheduler(timezone=utc)

def _job_listener(event: JobExecutionEvent):
    if event.exception:
        logger.error("Scheduler job raised an exception", exc_info=event.exception)

scheduler.add_listener(_job_listener, EVENT_JOB_ERROR)

def sync_trades():
    """Fetch latest trades from Robinhood and upsert to Supabase table."""
    if supabase is None:
        logger.error("Supabase client not configured; skipping sync.")
        return

    try:
        trades = get_all_trades_for_sync()
        logger.info("🔄 Syncing %d trades to Supabase table '%s'...", len(trades), SUPABASE_TABLE)

        for t in trades:
            # Build upsert payload; ensure keys match your Supabase schema
            rec = {
                "id": t.get("id"),
                "ticker": t.get("symbol"),
                "name": t.get("name"),
                "quantity": t.get("quantity"),
                "price": t.get("price"),
                "side": t.get("side"),
                "executed_at": t.get("executed_at"),
            }
            try:
                supabase.table(SUPABASE_TABLE).upsert(rec).execute()
            except Exception as e:
                # Log but continue with other rows
                logger.exception("Failed upsert for trade id=%s: %s", rec.get("id"), e)

        logger.info("✅ Trades synced to Supabase.")
    except Exception as e:
        logger.exception("Trade sync failed: %s", e)

# ----- Routes (preserve existing API) -----
@app.route("/")
def health():
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()})

@app.route("/api/portfolio")
def portfolio():
    try:
        data = get_portfolio_positions()
        return jsonify(data)
    except Exception as e:
        logger.exception("Error in /api/portfolio")
        return jsonify({"error": str(e)}), 500

@app.route("/api/portfolio/history")
def portfolio_history():
    try:
        span = request.args.get("span", "day")
        interval = request.args.get("interval", "5minute")
        bounds = "trading" if span == "day" else "regular"
        max_points = request.args.get("max_points", None)
        starting_cash = request.args.get("starting_cash", None)

        if max_points is not None:
            try:
                max_points = int(max_points)
            except Exception:
                max_points = None

        perf_data = get_portfolio_performance(
            span=span,
            interval=interval,
            bounds=bounds,
            starting_cash=starting_cash,
            max_points=max_points,
        )
        return jsonify(perf_data)
    except Exception as e:
        logger.exception("Error in /api/portfolio/history")
        return jsonify({"error": str(e)}), 500

@app.route("/api/portfolio/trades", methods=["GET"])
def portfolio_trades():
    if supabase is None:
        logger.error("Supabase client not configured; /api/portfolio/trades unavailable.")
        return jsonify({"error": "Supabase not configured"}), 500
    try:
        response = supabase.table(SUPABASE_TABLE).select("*").order("executed_at", desc=True).execute()
        return jsonify(response.data)
    except Exception as e:
        logger.exception("Error fetching trades from Supabase")
        return jsonify({"error": str(e)}), 500

@app.route("/api/portfolio/sync", methods=["POST"])
def manual_sync():
    try:
        sync_trades()
        return jsonify({"message": "Trades synced (manual)"})
    except Exception as e:
        logger.exception("Manual sync failed")
        return jsonify({"error": str(e)}), 500

# ----- Scheduler control helpers ----- 
def start_scheduler_if_needed():
    """
    Start the scheduler unless running under Gunicorn and START_SCHEDULER_ENV isn't true.
    Use START_SCHEDULER=true in Render environment to force the scheduler to start under Gunicorn
    for one instance (recommended approach is to run a single scheduler worker).
    """
    # Detect common Gunicorn run indicators
    running_under_gunicorn = (
        "gunicorn" in os.environ.get("SERVER_SOFTWARE", "").lower()
        or any("gunicorn" in p.lower() for p in sys.argv)
    )

    start_forced = START_SCHEDULER_ENV == "true"
    should_start = (not running_under_gunicorn) or start_forced

    if should_start:
        # Avoid starting twice
        if not scheduler.running:
            logger.info("Starting background scheduler (interval=%d min).", SYNC_INTERVAL_MINUTES)
            scheduler.add_job(sync_trades, "interval", minutes=SYNC_INTERVAL_MINUTES, id="sync_trades", replace_existing=True)
            scheduler.start()
        else:
            logger.info("Scheduler already running.")
    else:
        logger.info("Scheduler NOT started (running_under_gunicorn=%s, START_SCHEDULER=%s).", running_under_gunicorn, START_SCHEDULER_ENV)

def shutdown_scheduler():
    try:
        if scheduler and scheduler.running:
            logger.info("Shutting down scheduler...")
            scheduler.shutdown(wait=False)
            logger.info("Scheduler shut down.")
    except Exception as e:
        logger.exception("Error shutting down scheduler: %s", e)

# Ensure scheduler stops on exit
atexit.register(shutdown_scheduler)

# Start scheduler for local runs or if explicitly enabled
start_scheduler_if_needed()

# Optionally run an initial sync at startup (wrap in try so failures don't crash process)
try:
    logger.info("Running initial trade sync (startup).")
    sync_trades()
except Exception:
    logger.exception("Initial sync failed (continuing).")

# ----- Run app (development) -----
if __name__ == "__main__":
    # Only used when invoking `python app.py` locally. For Render use Gunicorn start command.
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=os.getenv("FLASK_DEBUG", "false").lower()=="true")