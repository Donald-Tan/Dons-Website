-- Create portfolio_positions table to cache current holdings
CREATE TABLE IF NOT EXISTS portfolio_positions (
    id TEXT PRIMARY KEY,
    ticker TEXT NOT NULL,
    name TEXT,
    quantity DECIMAL,
    avg_buy_price DECIMAL,
    current_price DECIMAL,
    market_value DECIMAL,
    unrealized_gain_loss DECIMAL,
    percent_change DECIMAL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_ticker ON portfolio_positions(ticker);
CREATE INDEX IF NOT EXISTS idx_portfolio_positions_updated ON portfolio_positions(last_updated DESC);

-- Create portfolio_history table to cache historical performance data
CREATE TABLE IF NOT EXISTS portfolio_history (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    market_value DECIMAL NOT NULL,
    baseline DECIMAL,
    span TEXT,  -- 'day', 'week', 'month', 'year', etc.
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(timestamp, span)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_portfolio_history_timestamp ON portfolio_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_history_span ON portfolio_history(span, timestamp DESC);

-- Enable Row Level Security (optional, can be disabled for simplicity)
ALTER TABLE portfolio_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_history ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since you're using service key)
CREATE POLICY "Enable all for service role" ON portfolio_positions FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON portfolio_history FOR ALL USING (true);
