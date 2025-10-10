# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from robin_client import get_portfolio_positions, get_stock_trades, get_portfolio_performance
from sqlalchemy import Column
from sqlalchemy.types import String, Float, DateTime
from apscheduler.schedulers.background import BackgroundScheduler
from pytz import utc
import os

# --- Flask App Setup ---
app = Flask(__name__)
CORS(app)

# --- Database Setup ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(BASE_DIR, 'trades.db')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

# --- Models ---
class Trade(db.Model):
    __tablename__ = "trade"
    id = Column(String, primary_key=True)  # UUID from Robinhood
    ticker = Column(String(10), nullable=False)
    name = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    side = Column(String(4), nullable=False)  # BUY / SELL
    executed_at = Column(DateTime, default=datetime.now(tz=utc), index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "ticker": self.ticker,
            "name": self.name,
            "quantity": self.quantity,
            "price": self.price,
            "side": self.side,
            "executed_at": self.executed_at.isoformat(),
        }

# --- Helper: Sync Trades ---
def sync_trades():
    """Fetch latest trades from Robinhood and update DB."""
    try:
        with app.app_context():
            fresh_trades = get_stock_trades(page=1, limit=1000, force_refresh=True)
            for t in fresh_trades.get("items", []):
                executed_at = datetime.fromisoformat(t["executed_at"])
                if executed_at.tzinfo is not None:
                    executed_at = executed_at.astimezone(utc).replace(tzinfo=None)

                trade = Trade.query.filter_by(id=t["id"]).first()
                if trade:
                    # update existing trade
                    trade.ticker = t["symbol"]
                    trade.name = t["name"]
                    trade.quantity = t["quantity"]
                    trade.price = t["price"]
                    trade.side = t["side"]
                    trade.executed_at = executed_at
                else:
                    # insert new trade
                    db.session.add(
                        Trade(
                            id=t["id"],
                            ticker=t["symbol"],
                            name=t["name"],
                            quantity=t["quantity"],
                            price=t["price"],
                            side=t["side"],
                            executed_at=executed_at
                        )
                    )
            db.session.commit()
            print(f"✅ Synced {len(fresh_trades.get('items', []))} trades")
    except Exception as e:
        print(f"⚠️ Failed to sync trades: {e}")

# --- Routes ---
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
            max_points=max_points
        )
        return jsonify(perf_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/portfolio")
def portfolio():
    try:
        return jsonify(get_portfolio_positions())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/portfolio/trades")
def portfolio_trades():
    try:
        trades = Trade.query.order_by(Trade.executed_at.desc()).all()
        return jsonify([t.to_dict() for t in trades])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Auto-create DB tables on startup ---
with app.app_context():
    db.create_all()
    sync_trades()  # sync immediately on startup
    print("✅ Database initialized and trades synced.")

# --- Scheduler ---
scheduler = BackgroundScheduler(timezone=utc)
scheduler.add_job(func=sync_trades, trigger="interval", minutes=5)
scheduler.start()
print("🕒 Background trade sync started (every 5 min)")

# --- Main Entry ---
if __name__ == "__main__":
    app.run(debug=True, port=5000)