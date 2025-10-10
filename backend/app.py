# app.py
# FastAPI app that:
#  - serves async endpoints
#  - uses AsyncIOScheduler for periodic syncs
#  - prefers cached data from Supabase for immediate frontend responses
#  - runs all blocking Robinhood work in background threads (via robin_client wrappers)

import os
import sys
import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.events import EVENT_JOB_ERROR, JobExecutionEvent
from dotenv import load_dotenv

# Import async supabase client
from supabase import AsyncClient

# Import async robin_client helpers
from robin_client import (
    get_portfolio_positions,
    get_portfolio_performance,
    get_all_trades_for_sync,
)

load_dotenv()

# -------------------------
# Config (env)
# -------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_TABLE = os.getenv("SUPABASE_TABLE", "trade")
SYNC_INTERVAL_MINUTES = int(os.getenv("SYNC_INTERVAL_MINUTES", "5"))
RUN_SCHEDULER = os.getenv("RUN_SCHEDULER", "true").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "*")  # comma-separated or "*" default

# -------------------------
# Logging
# -------------------------
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("backend")

# -------------------------
# FastAPI + CORS
# -------------------------
app = FastAPI(title="Portfolio API")
origins = [o.strip() for o in FRONTEND_ORIGINS.split(",")] if FRONTEND_ORIGINS != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Supabase async client (created at startup)
# -------------------------
supabase: Optional[AsyncClient] = None

# -------------------------
# Scheduler
# -------------------------
scheduler = AsyncIOScheduler()
scheduler.add_listener(lambda ev: logger.error("Scheduler job error", exc_info=True) if ev.exception else None, EVENT_JOB_ERROR)

# prevent overlapping syncs
_sync_lock = asyncio.Lock()


# -------------------------
# Utilities: supabase helpers
# -------------------------
async def _supabase_upsert_rows(rows: List[Dict[str, Any]], batch_size: int = 50, retries: int = 3):
    if supabase is None:
        raise RuntimeError("Supabase client not configured")
    if not rows:
        return

    for i in range(0, len(rows), batch_size):
        chunk = rows[i: i + batch_size]
        attempt = 0
        while True:
            try:
                # supabase async table upsert
                await supabase.table(SUPABASE_TABLE).upsert(chunk).execute()
                break
            except Exception as e:
                attempt += 1
                logger.warning("Supabase upsert attempt %d failed: %s", attempt, e)
                if attempt >= retries:
                    logger.exception("Failed to upsert chunk after %d attempts", retries)
                    break
                await asyncio.sleep(1 * attempt)


async def _supabase_fetch_all_trades() -> List[Dict[str, Any]]:
    if supabase is None:
        return []
    try:
        resp = await supabase.table(SUPABASE_TABLE).select("*").order("executed_at", desc=True).execute()
        return resp.data or []
    except Exception as e:
        logger.exception("Error fetching trades from Supabase: %s", e)
        return []


# -------------------------
# Background job: sync trades -> supabase
# -------------------------
async def sync_trades():
    """Background job: pull trades from Robinhood (via robin_client) and upsert to Supabase."""
    if supabase is None:
        logger.warning("Supabase client not configured; skipping sync.")
        return

    # ensure only one sync runs at a time
    if _sync_lock.locked():
        logger.info("Sync already in progress; skipping overlapping run.")
        return

    async with _sync_lock:
        try:
            logger.info("🔄 Starting trade sync from Robinhood...")
            trades = await get_all_trades_for_sync()
            if not trades:
                logger.info("No trades returned from robin_client; nothing to upsert.")
                return

            # normalize/ensure keys match DB schema (id, ticker, name, quantity, price, side, executed_at)
            payload = []
            for t in trades:
                payload.append({
                    "id": t.get("id"),
                    "ticker": t.get("symbol"),
                    "name": t.get("name"),
                    "quantity": t.get("quantity"),
                    "price": t.get("price"),
                    "side": t.get("side"),
                    "executed_at": t.get("executed_at"),
                })

            # Upsert in batches to avoid huge payloads
            await _supabase_upsert_rows(payload, batch_size=40, retries=3)
            logger.info("✅ Trades synced to Supabase. (%d rows) ", len(payload))
        except Exception as e:
            logger.exception("Trade sync failed: %s", e)


# -------------------------
# API Endpoints
# -------------------------
@app.get("/")
async def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


@app.get("/api/portfolio")
async def api_portfolio():
    """
    Return portfolio positions.
    Priority:
      1) Try Supabase cached positions (fast)
      2) Fallback to live (robin_client) - this still runs in background thread and is safe
    """
    # try Supabase
    if supabase is not None:
        try:
            rows = await _supabase_fetch_all_trades()  # trades table is the canonical source of truth here
            # Build quick positions summary from trades (optional) OR return positions table if you created it
            # For now, if trades exist return latest positions snapshot via robin_client (fast)
            if rows:
                # optional: if you keep a 'positions' table in supabase you can return that directly here for true instant response
                pass
        except Exception:
            logger.exception("Supabase read failed; falling back to robin_client")

    # fallback: compute positions from robin_client (which uses background threads)
    try:
        positions = await get_portfolio_positions()
        return positions
    except Exception as e:
        logger.exception("Error fetching positions")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/portfolio/history")
async def api_portfolio_history(span: str = "day", interval: str = "5minute", max_points: Optional[int] = None, starting_cash: Optional[float] = None):
    try:
        bounds = "trading" if span == "day" else "regular"
        data = await get_portfolio_performance(span=span, interval=interval, bounds=bounds, starting_cash=starting_cash, max_points=max_points)
        return data
    except Exception as e:
        logger.exception("Error computing portfolio history")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/portfolio/trades")
async def api_trades():
    if supabase is None:
        # fallback to direct robin_client sync
        try:
            trades = await get_all_trades_for_sync()
            return trades
        except Exception as e:
            logger.exception("Error reading trades fallback")
            raise HTTPException(status_code=500, detail=str(e))

    try:
        trades = await _supabase_fetch_all_trades()
        return trades
    except Exception as e:
        logger.exception("Error fetching trades from Supabase")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/portfolio/sync")
async def api_manual_sync():
    """Trigger a manual sync (rate-limited by sync lock)."""
    # schedule sync asynchronously but return quickly
    if _sync_lock.locked():
        return {"message": "Sync already in progress"}
    # run the sync task in the event loop (not blocking)
    asyncio.create_task(sync_trades())
    return {"message": "Manual sync started"}


# -------------------------
# Startup / shutdown events
# -------------------------
@app.on_event("startup")
async def startup_event():
    global supabase
    # init supabase client (async) after event loop ready
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            supabase = AsyncClient(SUPABASE_URL, SUPABASE_KEY)
            logger.info("Async Supabase client initialized.")
        except Exception:
            logger.exception("Failed to initialize Async Supabase client; supabase features disabled.")
            supabase = None
    else:
        logger.warning("Supabase env missing; running without Supabase.")

    # start scheduler if requested
    if RUN_SCHEDULER:
        if not scheduler.running:
            logger.info("Starting background scheduler (interval=%d min).", SYNC_INTERVAL_MINUTES)
            scheduler.add_job(sync_trades, "interval", minutes=SYNC_INTERVAL_MINUTES, id="sync_trades", replace_existing=True)
            scheduler.start()
        else:
            logger.info("Scheduler already running.")
        # run initial sync (don't block startup for too long)
        try:
            # do first sync but do not block startup for extended time
            await sync_trades()
        except Exception:
            logger.exception("Initial sync error (continuing).")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down application...")
    try:
        if scheduler and scheduler.running:
            logger.info("Shutting down scheduler...")
            scheduler.shutdown(wait=False)
    except Exception:
        logger.exception("Error shutting down scheduler")

    # close supabase if supported
    try:
        if supabase is not None:
            close_fn = getattr(supabase, "close", None)
            if close_fn:
                if asyncio.iscoroutinefunction(close_fn):
                    await close_fn()
                else:
                    close_fn()
            logger.info("Supabase client closed.")
    except Exception:
        logger.exception("Failed to close Supabase client cleanly.")