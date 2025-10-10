# app.py (single-service, async, Render-ready)
import os
import logging
import sys
import asyncio
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.events import EVENT_JOB_ERROR, JobExecutionEvent
from supabase import AsyncClient
from robin_client import (
    get_portfolio_positions,
    get_portfolio_performance,
    get_all_trades_for_sync,
)

# ----- Config -----
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_TABLE = os.getenv("SUPABASE_TABLE", "trade")
SYNC_INTERVAL_MINUTES = int(os.getenv("SYNC_INTERVAL_MINUTES", "5"))
RUN_SCHEDULER = os.getenv("RUN_SCHEDULER", "true").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

# ----- Logging -----
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("backend")

# ----- FastAPI app -----
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- Async Supabase client -----
supabase: AsyncClient | None = None
try:
    if SUPABASE_URL and SUPABASE_KEY:
        supabase = AsyncClient(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Async Supabase client initialized.")
    else:
        logger.warning("Supabase client NOT initialized (missing env vars).")
except Exception as e:
    logger.exception("Failed to create Supabase client: %s", e)
    supabase = None

# ----- Scheduler -----
scheduler = AsyncIOScheduler()

def _job_listener(event: JobExecutionEvent):
    if event.exception:
        logger.error("Scheduler job raised an exception", exc_info=event.exception)

scheduler.add_listener(_job_listener, EVENT_JOB_ERROR)

async def sync_trades():
    if supabase is None:
        logger.error("Supabase client not configured; skipping sync.")
        return

    try:
        trades = get_all_trades_for_sync()
        logger.info("🔄 Syncing %d trades to Supabase table '%s'...", len(trades), SUPABASE_TABLE)

        for t in trades:
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
                await supabase.table(SUPABASE_TABLE).upsert(rec).execute()
            except Exception as e:
                logger.exception("Failed upsert for trade id=%s: %s", rec.get("id"), e)

        logger.info("✅ Trades synced to Supabase.")
    except Exception as e:
        logger.exception("Trade sync failed: %s", e)

# ----- API Routes -----
@app.get("/")
async def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}

@app.get("/api/portfolio")
async def portfolio():
    try:
        data = get_portfolio_positions()
        return data
    except Exception as e:
        logger.exception("Error in /api/portfolio")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/portfolio/history")
async def portfolio_history(span: str = "day", interval: str = "5minute", max_points: int | None = None, starting_cash: float | None = None):
    try:
        bounds = "trading" if span == "day" else "regular"
        perf_data = get_portfolio_performance(
            span=span,
            interval=interval,
            bounds=bounds,
            starting_cash=starting_cash,
            max_points=max_points,
        )
        return perf_data
    except Exception as e:
        logger.exception("Error in /api/portfolio/history")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/portfolio/trades")
async def portfolio_trades():
    if supabase is None:
        logger.error("Supabase client not configured; /api/portfolio/trades unavailable.")
        raise HTTPException(status_code=500, detail="Supabase not configured")
    try:
        response = await supabase.table(SUPABASE_TABLE).select("*").order("executed_at", desc=True).execute()
        return response.data
    except Exception as e:
        logger.exception("Error fetching trades from Supabase")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/portfolio/sync")
async def manual_sync():
    try:
        await sync_trades()
        return {"message": "Trades synced (manual)"}
    except Exception as e:
        logger.exception("Manual sync failed")
        raise HTTPException(status_code=500, detail=str(e))

# ----- Startup / Scheduler -----
@app.on_event("startup")
async def startup_event():
    if RUN_SCHEDULER:
        if not scheduler.running:
            logger.info("Starting background scheduler (interval=%d min).", SYNC_INTERVAL_MINUTES)
            scheduler.add_job(sync_trades, "interval", minutes=SYNC_INTERVAL_MINUTES, id="sync_trades", replace_existing=True)
            scheduler.start()
        # Run initial sync
        await sync_trades()