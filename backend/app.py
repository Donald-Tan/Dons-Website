from flask import Flask, jsonify, request
from flask_cors import CORS
from robin_client import (
    get_portfolio_positions,
    get_portfolio_performance,
    get_all_trades_for_sync
)
from supabase import create_client, Client
from apscheduler.schedulers.background import BackgroundScheduler
from pytz import utc
from dotenv import load_dotenv
from datetime import datetime
import os

load_dotenv()

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app)

# --- Supabase Setup ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Helper: Sync Trades ---
def sync_trades():
    """Fetch latest trades from Robinhood and sync to Supabase."""
    try:
        fresh_trades = get_all_trades_for_sync()
        print(f"🔄 Found {len(fresh_trades)} trades to sync...")

        for t in fresh_trades:
            trade_record = {
                "id": t["id"],
                "ticker": t["symbol"],
                "name": t["name"],
                "quantity": t["quantity"],
                "price": t["price"],
                "side": t["side"],
                "executed_at": t["executed_at"],
            }
            # Upsert to Supabase (insert if new, update if exists)
            supabase.table("trade").upsert(trade_record).execute()

        print("✅ Trades synced successfully to Supabase.")
    except Exception as e:
        print(f"⚠️ Trade sync failed: {e}")

# --- Routes ---
@app.route("/api/portfolio")
def portfolio():
    try:
        return jsonify(get_portfolio_positions())
    except Exception as e:
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
        return jsonify({"error": str(e)}), 500

@app.route("/api/portfolio/trades")
def portfolio_trades():
    try:
        response = supabase.table("trade").select("*").order("executed_at", desc=True).execute()
        return jsonify(response.data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/portfolio/sync", methods=["POST"])
def manual_sync():
    try:
        sync_trades()
        return jsonify({"message": "Trades synced manually"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/")
def home():
    return jsonify({"status": "Backend running with Supabase + Render 🚀"})

# --- Scheduler ---
scheduler = BackgroundScheduler(timezone=utc)
scheduler.add_job(func=sync_trades, trigger="interval", minutes=5)
scheduler.start()
print("🕒 Background trade sync started (every 5 minutes)")

# --- Initial Sync ---
sync_trades()

# --- Main Entry ---
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)))