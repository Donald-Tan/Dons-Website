// src/components/InvestmentsComponent/PortfolioGraph.jsx
import React, { useEffect, useState, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import API_ENDPOINTS from "../../config/api";

const TIMEFRAMES = [
  { label: "1D", span: "day", interval: "5minute" },
  { label: "1W", span: "week", interval: "hour" },
  { label: "1M", span: "month", interval: "hour" },
  { label: "3M", span: "3month", interval: "day" },
  { label: "1Y", span: "year", interval: "day" },
  { label: "5Y", span: "5year", interval: "day" },
];

const getNiceDomain = (min, max, ticks = 5) => {
  if (min === max) return [Math.floor(min), Math.ceil(max)];
  const range = max - min;
  const roughStep = range / (ticks - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const niceStep = Math.ceil(roughStep / magnitude) * magnitude;
  return [
    Math.floor(min / niceStep) * niceStep,
    Math.ceil(max / niceStep) * niceStep,
  ];
};

// CustomTooltip component moved outside and made pure
const CustomTooltip = ({ active, payload, label, onHover }) => {
  useEffect(() => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      onHover(value);
    } else {
      onHover(null);
    }
  }, [active, payload, onHover]);

  if (active && payload && payload.length) {
    const date = new Date(label);
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <div
        style={{
          fontSize: "0.8rem",
          color: "#666",
          pointerEvents: "none",
        }}
      >
        {formattedDate} {formattedTime}
      </div>
    );
  }
  return null;
};

export const PortfolioGraph = () => {
  const [history, setHistory] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [change, setChange] = useState(0);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[0]);
  const [yDomain, setYDomain] = useState([0, "auto"]);
  const [loading, setLoading] = useState(false);

  // Track hovered point
  const [hoveredValue, setHoveredValue] = useState(null);
  const [hoveredChange, setHoveredChange] = useState(null);

  const abortControllerRef = useRef(null);
  const debounceRef = useRef(null);

  // Reduced for faster initial load - 200 points is plenty for a smooth graph
  const MAX_POINTS = 200;

  // Cache key for localStorage
  const getCacheKey = (tf) => `portfolio_history_${tf.span}_${tf.interval}`;

  // Extract data processing logic for reuse
  const processHistoryData = (data, fromFetch = true) => {
    if (!Array.isArray(data) || data.length === 0) {
      setHistory([]);
      setYDomain([0, "auto"]);
      setPortfolioValue(0);
      setChange(0);
      return;
    }

    const formatted = data
      .map((p) => ({
        timestamp: new Date(p.timestamp).getTime(),
        market_value: Number(p.market_value),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    setHistory(formatted);

    const latest = formatted[formatted.length - 1].market_value;
    const prev = formatted[0].market_value;
    setPortfolioValue(latest);
    setChange(Number((latest - prev).toFixed(2)));

    const min = Math.min(...formatted.map((d) => d.market_value));
    const max = Math.max(...formatted.map((d) => d.market_value));
    setYDomain(getNiceDomain(min, max));
  };

  const fetchHistory = async (tf, showLoadingSpinner = true) => {
    if (abortControllerRef.current) abortControllerRef.current.abort?.();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Try to load from localStorage cache first for instant display
    const cacheKey = getCacheKey(tf);
    const cached = localStorage.getItem(cacheKey);
    if (cached && !showLoadingSpinner) {
      try {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        // Use cached data if less than 2 minutes old
        if (Date.now() - timestamp < 120000) {
          // Process cached data without showing loading
          processHistoryData(cachedData, false);
        }
      } catch (e) {
        // Invalid cache, ignore
      }
    }

    if (showLoadingSpinner) setLoading(true);
    try {
      const res = await fetch(
        `${API_ENDPOINTS.portfolioHistory}?span=${tf.span}&interval=${tf.interval}&max_points=${MAX_POINTS}`,
        { signal: controller.signal }
      );
      const data = await res.json();

      // Save to cache
      localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));

      processHistoryData(data, true);
    } catch (err) {
      if (err.name !== "AbortError")
        console.error("History fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Try to load from cache immediately for instant display
    const cacheKey = getCacheKey(timeframe);
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        // Use cached data if less than 5 minutes old
        if (Date.now() - timestamp < 300000) {
          processHistoryData(cachedData, false);
        }
      } catch (e) {
        // Invalid cache, ignore
      }
    }

    // Reduced debounce from 150ms to 50ms for faster response
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchHistory(timeframe, !cached), 50);
    const intervalId = setInterval(() => fetchHistory(timeframe, false), 30000);
    return () => {
      clearTimeout(debounceRef.current);
      clearInterval(intervalId);
      abortControllerRef.current?.abort?.();
    };
  }, [timeframe]);

  // Handle tooltip hover
  const handleTooltipHover = (value) => {
    if (value !== null && history.length > 0) {
      const baselineValue = history[0].market_value;
      const pointChange = value - baselineValue;
      setHoveredValue(value);
      setHoveredChange(pointChange);
    } else {
      setHoveredValue(null);
      setHoveredChange(null);
    }
  };

  const displayValue = hoveredValue !== null ? hoveredValue : portfolioValue;
  const displayChange = hoveredChange !== null ? hoveredChange : change;

  const percentChange =
    history.length > 0
      ? ((displayChange / history[0].market_value) * 100).toFixed(2)
      : "0.00";

  const isGain =
    history.length > 1 &&
    history[history.length - 1].market_value >= history[0].market_value;

  return (
    <div className="portfolio-graph-card">
      {/* Header */}
      <div className="graph-header">
        <div className="portfolio-value">
          $
          {displayValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div
          className={`portfolio-change ${displayChange >= 0 ? "gain" : "loss"}`}
        >
          {displayChange >= 0 ? "▲" : "▼"}{" "}
          {displayChange.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          ({percentChange}%)
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="timeframe-selector">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.label}
            className={`timeframe-btn ${
              tf.label === timeframe.label ? "active" : ""
            }`}
            onClick={() => setTimeframe(tf)}
          >
            {tf.label}
          </button>
        ))}
        {loading && <div className="loader" />}
      </div>

      {/* Chart */}
      <div className="chart-container" style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={history}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tick={false}
              axisLine={false}
              height={0}
            />
            <YAxis
              domain={yDomain}
              tickFormatter={(v) => v.toFixed(2)}
              width={0}
              tick={false}
              line={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip onHover={handleTooltipHover} />} />
            <Area
              type="linear"
              dataKey="market_value"
              stroke={isGain ? "#16a34a" : "#dc2626"}
              strokeWidth={2}
              fill={isGain ? "#16a34a33" : "#dc262633"}
              isAnimationActive={false}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PortfolioGraph;
