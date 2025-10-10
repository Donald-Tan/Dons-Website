# robin_client.py
import robin_stocks.robinhood as r
from datetime import datetime, timezone, timedelta
import pytz
import requests
import threading
import time
import os
from dotenv import load_dotenv

load_dotenv()

RH_USERNAME = os.getenv("RH_USERNAME")
RH_PASSWORD = os.getenv("RH_PASSWORD")

_logged_in = False
_log_lock = threading.Lock()

# cache settings (tweak TTLs as desired)
_TRADES_TTL = 10     # seconds
_POSITIONS_TTL = 5   # seconds
_PERF_TTL = 15       # seconds

# caches (in-memory)
_trades_cache = {"data": [], "ts": 0}
_trades_lock = threading.Lock()

_positions_cache = {"data": [], "ts": 0}
_positions_lock = threading.Lock()

_performance_cache = {}  # key -> {"data": ..., "ts": ...}
_perf_lock = threading.Lock()

INTERVAL_TO_DELTA = {
    "5minute": timedelta(minutes=5),
    "10minute": timedelta(minutes=10),
    "hour": timedelta(hours=1),
    "day": timedelta(days=1),
    "week": timedelta(weeks=1),
}

def login():
    global _logged_in
    with _log_lock:
        if not _logged_in:
            r.login(RH_USERNAME, RH_PASSWORD)
            _logged_in = True

def _parse_iso_to_utc(dt_str):
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00")).astimezone(
            timezone.utc
        )
    except Exception:
        try:
            # fallback
            return datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%SZ").replace(
                tzinfo=timezone.utc
            )
        except Exception:
            return None

# -------------------------
# internal: build raw trades (same logic you had, but kept local)
# -------------------------
def _fetch_all_trades_raw():
    """
    Returns a list of trade dicts similar to your previous shape:
    {
      "id": ...,
      "symbol": ...,
      "name": ...,
      "side": "buy"/"sell",
      "quantity": float,
      "price": float,
      "executed_at": ISO str in UTC,
      "time_dt": datetime object (UTC) -- INTERNAL
      "state": ...
    }
    """
    login()
    orders = r.orders.get_all_stock_orders() or []
    trades = []

    for o in orders:
        try:
            if o.get("state") != "filled":
                continue

            symbol = o.get("symbol")
            name = None
            instrument_url = o.get("instrument")
            if instrument_url:
                try:
                    res = requests.get(instrument_url, timeout=5)
                    if res.ok:
                        inst = res.json()
                        symbol = inst.get("symbol") or symbol
                        name = (
                            inst.get("name")
                            or inst.get("simple_name")
                            or inst.get("title")
                            or name
                        )
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
                        ex_ts = _parse_iso_to_utc(
                            ex.get("timestamp")
                            or ex.get("created_at")
                            or o.get("last_transaction_at")
                        )
                        if not ex_ts:
                            continue
                        trades.append(
                            {
                                "id": ex.get("id") or o.get("id"),
                                "symbol": symbol,
                                "name": name or symbol,
                                "side": o.get("side"),
                                "quantity": round(ex_qty, 6),
                                "price": round(ex_price, 2),
                                "executed_at": ex_ts.astimezone(timezone.utc).isoformat(),
                                "time_dt": ex_ts.astimezone(timezone.utc),
                                "state": o.get("state") or "filled",
                            }
                        )
                    except Exception:
                        continue
            else:
                qty = float(o.get("quantity") or 0)
                price = float(o.get("average_price") or 0)
                ts = _parse_iso_to_utc(o.get("last_transaction_at"))
                if not ts:
                    continue
                trades.append(
                    {
                        "id": o.get("id"),
                        "symbol": symbol,
                        "name": name or symbol,
                        "side": o.get("side"),
                        "quantity": round(qty, 6),
                        "price": round(price, 2),
                        "executed_at": ts.astimezone(timezone.utc).isoformat(),
                        "time_dt": ts.astimezone(timezone.utc),
                        "state": o.get("state") or "filled",
                    }
                )
        except Exception:
            continue

    # sort newest-first
    trades.sort(key=lambda x: x["time_dt"], reverse=True)
    return trades

def _refresh_trades_cache(force=False):
    now = time.time()
    with _trades_lock:
        if not force and (now - _trades_cache["ts"]) < _TRADES_TTL:
            return
        try:
            trades = _fetch_all_trades_raw()
            _trades_cache["data"] = trades  # newest-first
            _trades_cache["ts"] = now
        except Exception:
            # keep old cache if refresh fails
            _trades_cache["ts"] = _trades_cache["ts"] or now

def get_stock_trades(page=1, limit=10, since=None, force_refresh=False):
    """
    Returns paginated trades newest-first.
    - page: 1-based page
    - limit: per-page limit
    - since: ISO timestamp string for new trades
    - force_refresh: refreshes cache from Robinhood
    """
    # refresh cache only if forced or TTL expired
    _refresh_trades_cache(force=force_refresh)

    with _trades_lock:
        trades = _trades_cache["data"][:]  # newest-first

    if since:
        since_dt = _parse_iso_to_utc(since)
        if not since_dt:
            return {"items": [], "total": 0}
        filtered = [t for t in trades if t["time_dt"] > since_dt]
        items = [{k: v for k, v in t.items() if k != "time_dt"} for t in filtered]
        return {"items": items, "total": len(items)}

    # page slicing (newest-first)
    try:
        page = max(1, int(page))
        limit = max(1, int(limit))
    except Exception:
        page = 1
        limit = 10

    offset = (page - 1) * limit
    sliced = trades[offset : offset + limit]
    items = [{k: v for k, v in t.items() if k != "time_dt"} for t in sliced]

    return {"items": items, "total": len(trades)}

# -------------------------
# portfolio positions (cached)
# -------------------------
def _refresh_positions_cache(force=False):
    now = time.time()
    with _positions_lock:
        if not force and (now - _positions_cache["ts"]) < _POSITIONS_TTL:
            return
        try:
            login()
            holdings = r.build_holdings() or {}
            result = []
            for ticker, pos in holdings.items():
                result.append(
                    {
                        "ticker": ticker,
                        "name": pos.get("name", ticker),
                        "quantity": round(float(pos.get("quantity", 0) or 0), 4),
                        "avg_buy_price": round(
                            float(pos.get("average_buy_price", 0) or 0), 4
                        ),
                        "current_price": round(float(pos.get("price", 0) or 0), 4),
                        "market_value": round(float(pos.get("equity", 0) or 0), 2),
                        "unrealized_gain_loss": round(
                            float(pos.get("equity_change", 0) or 0), 2
                        ),
                        "percent_change": round(
                            float(pos.get("percent_change", 0) or 0), 2
                        ),
                    }
                )
            _positions_cache["data"] = result
            _positions_cache["ts"] = now
        except Exception:
            _positions_cache["ts"] = _positions_cache["ts"] or now

def get_portfolio_positions():
    _refresh_positions_cache()
    with _positions_lock:
        return _positions_cache["data"][:]

# -------------------------
# portfolio performance (cached by key)
# -------------------------
def _perf_cache_key(span, interval, bounds, starting_cash, max_points):
    return f"{span}|{interval}|{bounds}|{starting_cash}|{max_points}"

def get_portfolio_performance(span="month", interval="day", bounds="regular", starting_cash=None, max_points=None):
    """
    Wrapper around original performance logic but cached per-params to avoid
    repeated historical calls to stock endpoints.
    """
    key = _perf_cache_key(span, interval, bounds, starting_cash, max_points)
    now = time.time()

    # return cached if valid
    with _perf_lock:
        if key in _performance_cache:
            entry = _performance_cache[key]
            if (now - entry["ts"]) < _PERF_TTL:
                return entry["data"]

    # Otherwise compute (using your original algorithm)
    # We'll reuse your previous logic but call get_stock_trades() which is cached.
    login()

    trades_struct = get_stock_trades(page=1, limit=10000)  # returns dict with items (newest-first)
    trades = trades_struct["items"][:]
    # We need trades sorted oldest->newest for the simulation
    trades = sorted(trades, key=lambda x: _parse_iso_to_utc(x["executed_at"]))

    symbols = sorted({t["symbol"] for t in trades})
    price_history = {}
    all_timestamps = set()
    delta = INTERVAL_TO_DELTA.get(interval, timedelta())

    for sym in symbols:
        try:
            hist = r.stocks.get_stock_historicals(
                sym, interval=interval, span=span, bounds=bounds
            ) or []
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

    # optional max_points trimming (downsample)
    if max_points and isinstance(max_points, int) and len(all_timestamps) > max_points:
        # pick approx evenly spaced timestamps
        step = max(1, len(all_timestamps) // max_points)
        all_timestamps = all_timestamps[::step]

    invested_calc = 0.0
    for t in trades:
        amt = float(t["quantity"]) * float(t["price"])
        if t["side"] == "buy":
            invested_calc += amt
        elif t["side"] == "sell":
            invested_calc -= amt

    if starting_cash is None:
        starting_cash_val = invested_calc
    else:
        starting_cash_val = float(starting_cash)

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
                    avg_cost = (
                        positions[sym]["total_cost"] / positions[sym]["shares"]
                        if positions[sym]["shares"] > 0
                        else 0.0
                    )
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
                    latest = r.stocks.get_latest_price(sym)
                    if latest:
                        price = float(latest[0]) if latest[0] is not None else None
                except Exception:
                    price = None
            if price is None:
                continue
            market_value_positions += pos["shares"] * price

        market_value = cash_running + market_value_positions
        if first_market_value is None:
            first_market_value = market_value

        ts_eastern = ts.astimezone(eastern)
        portfolio_history.append(
            {
                "timestamp": ts_eastern.isoformat(),
                "market_value": round(market_value, 2),
                "baseline": round(starting_cash_val, 2),
            }
        )

    # cache result
    with _perf_lock:
        _performance_cache[key] = {"data": portfolio_history, "ts": time.time()}

    return portfolio_history