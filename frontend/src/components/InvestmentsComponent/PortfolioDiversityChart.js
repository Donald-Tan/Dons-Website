// src/components/InvestmentsComponent/PortfolioDiversityChart.jsx
import React, { useEffect, useState, useRef } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import PropTypes from "prop-types";

const DEFAULT_GRAY = "hsl(0, 0%, 75%)";

const mapPctToGreen = (pct, minPct, maxPct) => {
  if (typeof pct !== "number") pct = 0;
  if (maxPct === minPct) {
    return `hsl(120, 65%, 45%)`;
  }

  let norm = (pct - minPct) / (maxPct - minPct);
  norm = Math.max(0, Math.min(1, norm));

  const minLightness = 30;
  const maxLightness = 80;
  const lightness = maxLightness - norm * (maxLightness - minLightness);

  const minSat = 50;
  const maxSat = 85;
  const saturation = minSat + norm * (maxSat - minSat);

  return `hsl(120, ${saturation}%, ${lightness}%)`;
};

export const PortfolioDiversityChart = ({
  fetchUrl = "http://127.0.0.1:5000/api/portfolio",
  pollInterval = 60000,
  othersThreshold = 0.02,
}) => {
  const [slices, setSlices] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isPressing, setIsPressing] = useState(false);

  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const previousDataRef = useRef(null);

  const money = (v) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(v || 0));

  const load = async () => {
    try {
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error("Network response was not ok");
      const json = await res.json();

      if (!Array.isArray(json)) {
        if (json && json.error) {
          setError(json.error);
        } else if (json && Array.isArray(json.data)) {
          processPositions(json.data);
        } else {
          setError("Unexpected response from server.");
        }
        return;
      }

      processPositions(json);
      setError("");
    } catch (e) {
      setError("Failed to fetch portfolio.");
      console.error("Portfolio fetch error:", e);
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  };

  const processPositions = (positions = []) => {
    const normalized = positions.map((p) => {
      const mv =
        Number(p.market_value) ||
        Number(p.quantity) * Number(p.current_price) ||
        0;
      return {
        ticker: p.ticker || p.symbol || p.name || "UNKNOWN",
        name: p.name || p.ticker || p.symbol || "",
        market_value: Number(Number(mv).toFixed(2)),
      };
    });

    const totalValue = normalized.reduce((s, x) => s + x.market_value, 0);
    if (!totalValue) {
      setSlices([]);
      setTotal(0);
      return;
    }

    normalized.sort((a, b) => b.market_value - a.market_value);

    let otherValue = 0;
    const main = [];
    normalized.forEach((item, idx) => {
      const pct = item.market_value / totalValue;
      if (pct < othersThreshold) {
        otherValue += item.market_value;
      } else {
        main.push({
          name: item.ticker,
          value: item.market_value,
          rawPct: pct,
          rank: idx,
          isOther: false,
        });
      }
    });

    if (otherValue > 0) {
      main.push({
        name: "Other",
        value: Number(otherValue.toFixed(2)),
        rawPct: otherValue / totalValue,
        rank: main.length,
        isOther: true,
      });
    }

    // Only update if data actually changed
    const newData = { slices: main, total: Number(totalValue.toFixed(2)) };
    const currentData = JSON.stringify(previousDataRef.current);
    const nextData = JSON.stringify(newData);

    if (currentData !== nextData) {
      setSlices(main);
      setTotal(Number(totalValue.toFixed(2)));
      previousDataRef.current = newData;
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, pollInterval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUrl, pollInterval, othersThreshold]);

  // Per-cell enter/leave handlers (more reliable across browsers)
  const onCellEnter = (index) => {
    setActiveIndex(index);
    setIsHovering(true);
  };
  const onCellLeave = () => {
    setIsHovering(false);
    // If not pressing, fully clear activeIndex so slice returns to normal
    if (!isPressing) {
      setActiveIndex(null);
    }
  };

  // Press handlers
  const onCellPressStart = (index) => {
    setActiveIndex(index);
    setIsPressing(true);
  };

  const onCellPressEnd = () => {
    // Stop pressing and restore slice visibility
    setIsPressing(false);
    // If pointer is currently hovering over a slice, keep that index; otherwise clear.
    if (!isHovering) {
      setActiveIndex(null);
    }
  };

  // container leave / touchcancel fallback
  const handleContainerLeave = () => {
    setIsHovering(false);
    setIsPressing(false);
    setActiveIndex(null);
  };

  // Global cleanup for mobile: ensure releasing anywhere clears press state and activeIndex
  useEffect(() => {
    const handleGlobalUp = (ev) => {
      // If the release happens inside the chart container, we still want to clear pressing state.
      // Always clear pressing and active index unless the pointer is still hovering (rare on mobile).
      setIsPressing(false);
      if (!isHovering) setActiveIndex(null);
    };

    window.addEventListener("pointerup", handleGlobalUp);
    window.addEventListener("touchend", handleGlobalUp, { passive: true });
    window.addEventListener("touchcancel", handleGlobalUp, { passive: true });
    // click fallback (some browsers)
    window.addEventListener("click", handleGlobalUp);

    return () => {
      window.removeEventListener("pointerup", handleGlobalUp);
      window.removeEventListener("touchend", handleGlobalUp);
      window.removeEventListener("touchcancel", handleGlobalUp);
      window.removeEventListener("click", handleGlobalUp);
    };
  }, [isHovering]);

  const nonOther = slices.filter((s) => !s.isOther);
  const minPct = nonOther.length
    ? Math.min(...nonOther.map((s) => s.rawPct))
    : 0;
  const maxPct = nonOther.length
    ? Math.max(...nonOther.map((s) => s.rawPct))
    : 0;

  const activeSlice = activeIndex !== null ? slices[activeIndex] : null;
  const activePercentage = activeSlice
    ? ((activeSlice.value / total) * 100).toFixed(1)
    : null;

  if (loading) {
    return (
      <div
        ref={cardRef}
        className="portfolio-chart-card"
        role="region"
        aria-label="Portfolio diversity"
      >
        <div className="chart-empty">Loading...</div>
      </div>
    );
  }

  if (error || !slices || slices.length === 0) {
    return (
      <div
        ref={cardRef}
        className="portfolio-chart-card"
        role="region"
        aria-label="Portfolio diversity"
      >
        <div className="chart-empty">{error || "No holdings to display"}</div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="portfolio-chart-card"
      role="region"
      aria-label="Portfolio diversity"
    >
      <div
        ref={containerRef}
        className="portfolio-chart-inner"
        onMouseLeave={handleContainerLeave}
        onTouchCancel={handleContainerLeave}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              dataKey="value"
              data={slices}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="95%"
              innerRadius="50%"
              labelLine={false}
              isAnimationActive={false}
              activeIndex={activeIndex}
              activeShape={{ outerRadius: "105%" }}
              label={({
                cx,
                cy,
                midAngle,
                innerRadius: inR,
                outerRadius: outR,
                name,
              }) => {
                const RADIAN = Math.PI / 180;
                const radius = inR + (outR - inR) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                return (
                  <text
                    x={x}
                    y={y}
                    fill="#fff"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="pie-slice-label"
                    key={`label-${name}`}
                    style={{ pointerEvents: "none" }}
                  >
                    {name}
                  </text>
                );
              }}
            >
              {slices.map((entry, index) => {
                const fill = entry.isOther
                  ? DEFAULT_GRAY
                  : mapPctToGreen(entry.rawPct, minPct, maxPct);
                return (
                  <Cell
                    key={`cell-${entry.name}-${entry.value}`}
                    fill={fill}
                    stroke="rgba(255,255,255,0.2)"
                    style={{ outline: "none" }}
                    // Hover / pointer
                    onMouseEnter={() => onCellEnter(index)}
                    onMouseLeave={() => onCellLeave(index)}
                    onPointerEnter={() => onCellEnter(index)}
                    onPointerLeave={() => onCellLeave(index)}
                    // Press / touch
                    onMouseDown={() => onCellPressStart(index)}
                    onMouseUp={onCellPressEnd}
                    onTouchStart={() => onCellPressStart(index)}
                    onTouchEnd={onCellPressEnd}
                    onTouchCancel={onCellPressEnd}
                  />
                );
              })}
            </Pie>

            {/* Center content — pointerEvents none so it won't intercept touches */}
            {activeSlice && (isHovering || isPressing) && (
              <g className="pie-center-group" style={{ pointerEvents: "none" }}>
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="pie-center-content"
                  style={{ pointerEvents: "none" }}
                >
                  <tspan className="pie-name" x="50%" dy="-1em">
                    {activeSlice.name}
                  </tspan>
                  <tspan className="pie-value" x="50%" dy="1.2em">
                    {money(activeSlice.value)}
                  </tspan>
                  <tspan className="pie-percentage" x="50%" dy="1.2em">
                    {activePercentage}%
                  </tspan>
                </text>
              </g>
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

PortfolioDiversityChart.propTypes = {
  fetchUrl: PropTypes.string,
  pollInterval: PropTypes.number,
  othersThreshold: PropTypes.number,
};

export default PortfolioDiversityChart;
