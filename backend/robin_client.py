# robin_client.py
# Async-friendly wrapper around synchronous robin_stocks usage.
# - All blocking I/O runs inside asyncio.to_thread()
# - Small retry/backoff helpers for network resilience
# - Preserves original behavior/outputs but exposes async functions

import os
import time
import threading
import requests
import asyncio
import pickle
import base64
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Callable
from dotenv import load_dotenv

load_dotenv()

# try to import robin_stocks (synchronous lib)
try:
    import robin_stocks.robinhood as r  # type: ignore
except Exception:
    r = None  # safe fallback; callers will handle if r is None

import pytz

# env
RH_USERNAME = os.getenv("RH_USERNAME")
RH_PASSWORD = os.getenv("RH_PASSWORD")

# Session persistence file - store in backend directory for persistence across restarts
SESSION_FILE = Path(__file__).parent / ".robinhood_session.pickle"

# internal login state
_logged_in = False
_log_lock = threading.Lock()

# caching TTLs (seconds) - Longer cache = faster response
# Your portfolio data doesn't change every second, so we cache longer
_TRADES_TTL = float(os.getenv("TRADES_TTL", "300"))  # 5 minutes
_POSITIONS_TTL = float(os.getenv("POSITIONS_TTL", "60"))  # 1 minute
_PERF_TTL = float(os.getenv("PERF_TTL", "300"))  # 5 minutes

# in-memory caches (thread-safe with locks)
_trades_cache: Dict[str, Any] = {"data": [], "ts": 0.0}
_trades_lock = threading.Lock()

_positions_cache: Dict[str, Any] = {"data": [], "ts": 0.0}
_positions_lock = threading.Lock()

_performance_cache: Dict[str, Any] = {}
_perf_lock = threading.Lock()

INTERVAL_TO_DELTA = {
    "5minute": timedelta(minutes=5),
    "10minute": timedelta(minutes=10),
    "hour": timedelta(hours=1),
    "day": timedelta(days=1),
    "week": timedelta(weeks=1),
}


# ----------------------
# Helpers
# ----------------------
def _now_ts() -> float:
    return time.time()


def _call_with_retries_sync(func: Callable, *args, retries: int = 3, backoff: float = 1.0, **kwargs):
    """Run a sync function with retries/backoff. Useful for network calls."""
    last_exc = None
    for attempt in range(1, retries + 1):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            last_exc = e
            # Check if it's an authentication error
            error_msg = str(e).lower()
            if "unauthorized" in error_msg or "401" in error_msg or "authentication" in error_msg:
                # Session expired - force re-login
                global _logged_in
                _logged_in = False
                try:
                    _login_sync()
                    # Retry the function call after re-login
                    return func(*args, **kwargs)
                except Exception:
                    pass  # If re-login fails, continue with normal retry logic

            if attempt == retries:
                raise
            time.sleep(backoff * attempt)
    raise last_exc  # pragma: no cover


def _parse_iso_to_utc(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        try:
            return datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        except Exception:
            return None


# ----------------------
# Robinhood login & wrappers (sync)
# ----------------------
def _save_session():
    """Save the current session token to file for persistence across restarts."""
    try:
        # Get the current session from robin_stocks (stored in module globals)
        if not hasattr(r, 'authentication') or not hasattr(r.authentication, 'get_all_tokens'):
            print("Warning: Cannot save session - robin_stocks API not available")
            return

        tokens = r.authentication.get_all_tokens()
        if tokens:
            # Save to file
            with open(SESSION_FILE, 'wb') as f:
                pickle.dump(tokens, f)
            print(f"✓ Session saved to {SESSION_FILE}")

            # Also print base64-encoded version for environment variable storage
            tokens_b64 = base64.b64encode(pickle.dumps(tokens)).decode('utf-8')
            print(f"\n📋 To persist this session on Render.com, add this environment variable:")
            print(f"RH_SESSION_TOKEN={tokens_b64[:50]}...\n")
    except Exception as e:
        print(f"Failed to save session: {e}")


def _load_session():
    """Load session token from environment variable or file."""
    try:
        tokens = None

        # First, try to load from environment variable (for Render.com)
        env_token = os.getenv('RH_SESSION_TOKEN')
        if env_token:
            try:
                tokens = pickle.loads(base64.b64decode(env_token))
                print("✓ Session loaded from environment variable")
            except Exception as e:
                print(f"Failed to decode env session: {e}")

        # Fallback to file (for local development)
        if not tokens and SESSION_FILE.exists():
            with open(SESSION_FILE, 'rb') as f:
                tokens = pickle.load(f)
            print(f"✓ Session loaded from {SESSION_FILE}")

        if not tokens:
            return False

        # Set the loaded tokens in robin_stocks
        if hasattr(r, 'authentication') and hasattr(r.authentication, 'set_login_state'):
            r.authentication.set_login_state(tokens)
            return True
        return False
    except Exception as e:
        print(f"Failed to load session: {e}")
        return False


def _login_sync():
    """Synchronous login call (wrapped by asyncio.to_thread in async functions)."""
    global _logged_in
    if r is None:
        raise RuntimeError("robin_stocks not installed or import failed")
    with _log_lock:
        if not _logged_in:
            # Try to load session from our custom file first
            if _load_session():
                try:
                    # Verify the session is still valid
                    profile = r.profiles.load_account_profile()
                    if profile and isinstance(profile, dict):
                        _logged_in = True
                        print("✓ Using persisted session - no login required!")
                        return
                except Exception:
                    print("⚠ Persisted session expired, logging in fresh")
            # First, try to verify if we already have a valid session
            # by attempting a simple API call
            try:
                # Try to get account profile - if this works, we're already logged in
                profile = r.profiles.load_account_profile()
                if profile and isinstance(profile, dict):
                    # Session is still valid!
                    _logged_in = True
                    return
            except Exception:
                # Session invalid or doesn't exist, need to login
                pass

            # Try to use existing session first - robin_stocks stores session in .pickle file
            # This will automatically reuse the session if it's still valid
            # Only prompts for 2FA/push notification if session expired or invalid
            r.login(
                RH_USERNAME,
                RH_PASSWORD,
                expiresIn=2592000,  # 30 days (maximum allowed by Robinhood)
                store_session=True  # persist session to avoid re-authentication
            )
            _logged_in = True

            # Save session to our custom file for persistence across server restarts
            _save_session()


async def ensure_logged_in_async():
    """Async wrapper to ensure logged in (idempotent)."""
    # If already logged in we still want to avoid blocking loop: check flag then quickly return.
    global _logged_in
    if _logged_in:
        return
    await asyncio.to_thread(_login_sync)


def _refresh_session_sync():
    """Refresh the session to keep it alive. Called periodically."""
    global _logged_in
    if not _logged_in:
        return

    try:
        # Make a lightweight API call to verify session is still valid
        profile = r.profiles.load_account_profile()
        if not profile or not isinstance(profile, dict):
            # Session invalid, force re-login
            _logged_in = False
            _login_sync()
    except Exception:
        # Session likely expired, force re-login
        _logged_in = False
        try:
            _login_sync()
        except Exception:
            pass  # Will retry on next call


async def refresh_session_async():
    """Async wrapper for session refresh. Call this periodically to maintain session."""
    await asyncio.to_thread(_refresh_session_sync)


# ----------------------
# Trades fetching (sync implementation, run in thread)
# ----------------------
def _fetch_all_trades_raw_sync() -> List[Dict[str, Any]]:
    """Original synchronous logic to fetch and normalize trades from Robinhood."""
    if r is None:
        return []

    # ensure login
    _login_sync()

    orders = []
    try:
        orders = _call_with_retries_sync(r.orders.get_all_stock_orders, retries=3, backoff=1)
    except Exception:
        orders = []  # fall back to empty

    trades: List[Dict[str, Any]] = []

    for o in orders or []:
        try:
            if o.get("state") != "filled":
                continue

            symbol = o.get("symbol")
            name = None
            instrument_url = o.get("instrument")
            if instrument_url:
                try:
                    # instrument lookups can fail - do small retry
                    res = _call_with_retries_sync(requests.get, instrument_url, timeout=5, retries=2, backoff=0.5)
                    if getattr(res, "ok", False):
                        inst = res.json()
                        symbol = inst.get("symbol") or symbol
                        name = inst.get("name") or inst.get("simple_name") or inst.get("title") or name
                except Exception:
                    pass

            if not symbol:
                continue

            executions = o.get("executions") or []
            if executions:
                for ex in executions:
                    try:
                        ex_qty = float(ex.get("quantity") or 0)
                        ex_price = float(ex.get("price") or o.get("average_price") or 0)
                        ex_ts = _parse_iso_to_utc(ex.get("timestamp") or ex.get("created_at") or o.get("last_transaction_at"))
                        if not ex_ts:
                            continue
                        trades.append({
                            "id": ex.get("id") or o.get("id"),
                            "symbol": symbol,
                            "name": name or symbol,
                            "side": o.get("side"),
                            "quantity": round(ex_qty, 6),
                            "price": round(ex_price, 2),
                            "executed_at": ex_ts.astimezone(timezone.utc).isoformat(),
                            "time_dt": ex_ts.astimezone(timezone.utc),
                            "state": o.get("state") or "filled",
                        })
                    except Exception:
                        continue
            else:
                qty = float(o.get("quantity") or 0)
                price = float(o.get("average_price") or 0)
                ts = _parse_iso_to_utc(o.get("last_transaction_at"))
                if not ts:
                    continue
                trades.append({
                    "id": o.get("id"),
                    "symbol": symbol,
                    "name": name or symbol,
                    "side": o.get("side"),
                    "quantity": round(qty, 6),
                    "price": round(price, 2),
                    "executed_at": ts.astimezone(timezone.utc).isoformat(),
                    "time_dt": ts.astimezone(timezone.utc),
                    "state": o.get("state") or "filled",
                })
        except Exception:
            continue

    trades.sort(key=lambda x: x["time_dt"], reverse=True)
    return trades


def _refresh_trades_cache_sync(force: bool = False):
    """Sync version of cache refresh. Quick check TTL then fetch if needed."""
    now = _now_ts()
    with _trades_lock:
        if not force and (now - _trades_cache["ts"]) < _TRADES_TTL:
            return
        try:
            trades = _fetch_all_trades_raw_sync()
            _trades_cache["data"] = trades
            _trades_cache["ts"] = now
        except Exception:
            # keep old cache if refresh fails
            _trades_cache["ts"] = _trades_cache.get("ts") or now


async def _refresh_trades_cache_async(force: bool = False):
    await asyncio.to_thread(_refresh_trades_cache_sync, force)


# ----------------------
# Public async trade accessor
# ----------------------
async def get_stock_trades(page: int = 1, limit: int = 10, since: Optional[str] = None, force_refresh: bool = False) -> Dict[str, Any]:
    """
    Returns newset-first trades structure:
    { "items": [...], "total": N }
    """
    await _refresh_trades_cache_async(force_refresh)

    with _trades_lock:
        trades = list(_trades_cache["data"])  # newest-first

    if since:
        since_dt = _parse_iso_to_utc(since)
        if not since_dt:
            return {"items": [], "total": 0}
        filtered = [t for t in trades if t["time_dt"] > since_dt]
        items = [{k: v for k, v in t.items() if k != "time_dt"} for t in filtered]
        return {"items": items, "total": len(items)}

    try:
        page = max(1, int(page))
        limit = max(1, int(limit))
    except Exception:
        page = 1
        limit = 10

    offset = (page - 1) * limit
    sliced = trades[offset: offset + limit]
    items = [{k: v for k, v in t.items() if k != "time_dt"} for t in sliced]
    return {"items": items, "total": len(trades)}


# ----------------------
# Positions (sync fetch then async wrapper)
# ----------------------
def _refresh_positions_cache_sync(force: bool = False):
    now = _now_ts()
    with _positions_lock:
        if not force and (now - _positions_cache["ts"]) < _POSITIONS_TTL:
            return
        try:
            _login_sync()
            holdings = _call_with_retries_sync(r.build_holdings, retries=3, backoff=1) if r else {}
            result = []
            for ticker, pos in (holdings.items() if isinstance(holdings, dict) else []):
                result.append({
                    "ticker": ticker,
                    "name": pos.get("name", ticker),
                    "quantity": round(float(pos.get("quantity", 0) or 0), 4),
                    "avg_buy_price": round(float(pos.get("average_buy_price", 0) or 0), 4),
                    "current_price": round(float(pos.get("price", 0) or 0), 4),
                    "market_value": round(float(pos.get("equity", 0) or 0), 2),
                    "unrealized_gain_loss": round(float(pos.get("equity_change", 0) or 0), 2),
                    "percent_change": round(float(pos.get("percent_change", 0) or 0), 2),
                })
            _positions_cache["data"] = result
            _positions_cache["ts"] = now
        except Exception:
            _positions_cache["ts"] = _positions_cache.get("ts") or now


async def _refresh_positions_cache_async(force: bool = False):
    await asyncio.to_thread(_refresh_positions_cache_sync, force)


async def get_portfolio_positions() -> List[Dict[str, Any]]:
    await _refresh_positions_cache_async()
    with _positions_lock:
        return list(_positions_cache["data"])


# ----------------------
# Performance calculation (sync heavy lifting, used in thread)
# ----------------------
def _compute_portfolio_performance_sync(span="month", interval="day", bounds="regular", starting_cash=None, max_points=None) -> List[Dict[str, Any]]:
    # This function is the sync version of your original algorithm (keeps the same logic)
    key = _perf_cache_key = f"{span}|{interval}|{bounds}|{starting_cash}|{max_points}"
    now = _now_ts()

    # cached return if valid
    with _perf_lock:
        entry = _performance_cache.get(key)
        if entry and (now - entry["ts"]) < _PERF_TTL:
            return entry["data"]

    # compute - re-use get_stock_trades (sync since called inside thread)
    trades_struct = _fetch_all_trades_raw_sync()
    trades = trades_struct[:]
    trades = sorted(trades, key=lambda x: _parse_iso_to_utc(x["executed_at"]))

    symbols = sorted({t["symbol"] for t in trades})
    price_history = {}
    all_timestamps = set()
    delta = INTERVAL_TO_DELTA.get(interval, timedelta())

    for sym in symbols:
        try:
            hist = _call_with_retries_sync(lambda: r.stocks.get_stock_historicals(sym, interval=interval, span=span, bounds=bounds), retries=2, backoff=0.8) or []
        except Exception:
            hist = []
        price_history[sym] = {}
        for p in hist:
            begins_at = p.get("begins_at")
            close_price = p.get("close_price") or p.get("close")
            if not begins_at or close_price is None:
                continue
            ts = _parse_iso_to_utc(begins_at)
            if not ts:
                continue
            ts = ts + delta
            price_history[sym][ts] = float(close_price)
            all_timestamps.add(ts)

    if not all_timestamps:
        all_timestamps = { _parse_iso_to_utc(t["executed_at"]) for t in trades }

    all_timestamps = sorted(all_timestamps)

    if max_points and isinstance(max_points, int) and len(all_timestamps) > max_points:
        step = max(1, len(all_timestamps) // max_points)
        all_timestamps = all_timestamps[::step]

    invested_calc = 0.0
    for t in trades:
        amt = float(t["quantity"]) * float(t["price"])
        if t["side"] == "buy":
            invested_calc += amt
        elif t["side"] == "sell":
            invested_calc -= amt

    starting_cash_val = invested_calc if starting_cash is None else float(starting_cash)

    positions = {}
    trades_idx = 0
    cash_running = starting_cash_val
    eastern = pytz.timezone("US/Eastern")
    portfolio_history = []

    first_market_value = None

    for ts in all_timestamps:
        while trades_idx < len(trades) and _parse_iso_to_utc(trades[trades_idx]["executed_at"]) <= ts:
            t = trades[trades_idx]
            sym = t["symbol"]
            amt = float(t["quantity"]) * float(t["price"])
            if sym not in positions:
                positions[sym] = {"shares": 0.0, "total_cost": 0.0}
            if t["side"] == "buy":
                cash_running -= amt
                positions[sym]["shares"] += float(t["quantity"])
                positions[sym]["total_cost"] += amt
            elif t["side"] == "sell":
                cash_running += amt
                if positions[sym]["shares"] > 0:
                    qty_to_sell = min(float(t["quantity"]), positions[sym]["shares"])
                    avg_cost = (positions[sym]["total_cost"] / positions[sym]["shares"]) if positions[sym]["shares"] > 0 else 0.0
                    positions[sym]["shares"] -= qty_to_sell
                    positions[sym]["total_cost"] -= qty_to_sell * avg_cost
            trades_idx += 1

        market_value_positions = 0.0
        for sym, pos in positions.items():
            if pos["shares"] <= 0:
                continue
            hist = price_history.get(sym, {})
            candidate_ts = max((p_ts for p_ts in hist if p_ts <= ts), default=None)
            price = None
            if candidate_ts:
                price = hist[candidate_ts]
            else:
                try:
                    latest = _call_with_retries_sync(lambda: r.stocks.get_latest_price(sym), retries=2, backoff=0.8)
                    price = float(latest[0]) if latest and latest[0] is not None else None
                except Exception:
                    price = None
            if price is None:
                continue
            market_value_positions += pos["shares"] * price

        market_value = cash_running + market_value_positions
        if first_market_value is None:
            first_market_value = market_value

        ts_eastern = ts.astimezone(eastern)
        portfolio_history.append({
            "timestamp": ts_eastern.isoformat(),
            "market_value": round(market_value, 2),
            "baseline": round(starting_cash_val, 2),
        })

    with _perf_lock:
        _performance_cache[_perf_cache_key] = {"data": portfolio_history, "ts": _now_ts()}

    return portfolio_history


async def get_portfolio_performance(span="month", interval="day", bounds="regular", starting_cash=None, max_points=None):
    # offload the heavy computation to thread
    return await asyncio.to_thread(_compute_portfolio_performance_sync, span, interval, bounds, starting_cash, max_points)


# ----------------------
# Bulk helper for sync (used by scheduler)
# ----------------------
async def get_all_trades_for_sync() -> List[Dict[str, Any]]:
    result = await get_stock_trades(page=1, limit=10000, force_refresh=True)
    return result.get("items", [])