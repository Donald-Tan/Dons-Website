// src/pages/Investment.js
import React, { useState, useEffect } from "react";
import { PortfolioTable } from "../components/InvestmentsComponent/PortfolioTable";
import { PortfolioGraph } from "../components/InvestmentsComponent/PortfolioGraph";
import { TradesTable } from "../components/InvestmentsComponent/TradesTable";
import { InvestmentProfile } from "../components/InvestmentsComponent/InvestmentProfile";
import { PortfolioDiversityChart } from "../components/InvestmentsComponent/PortfolioDiversityChart";

export const Investment = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleFlip = (e) => {
    if (!isMobile) return;

    // If touch moved more than 10px, it's a scroll not a tap
    if (e.changedTouches && e.changedTouches[0]) {
      const touchEndY = e.changedTouches[0].clientY;
      const touchDiff = Math.abs(touchEndY - touchStartY);
      if (touchDiff > 10) {
        return; // This was a scroll, don't flip
      }
    }

    setIsFlipped(!isFlipped);
  };

  return (
    <div className="dashboard-grid">
      {/* Graph takes 2 columns - on first row */}
      <div className="graph-box">
        <PortfolioGraph />
      </div>
      {/* Chart takes 1 column - on first row, right of profile */}
      <div className="chart-box">
        <PortfolioDiversityChart />
      </div>
      {/* Profile takes 1 column - on first row, right of graph */}
      <div
        className={`profile-box ${isMobile ? 'flip-container' : ''} ${isFlipped ? 'flipped' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleFlip}
        onClick={!isMobile ? handleFlip : undefined}
      >
        <InvestmentProfile isFlipped={isFlipped} isMobile={isMobile} />
      </div>

      {/* Portfolio table takes 2 columns (half width) */}
      <div className="portfolio-box">
        <PortfolioTable />
      </div>

      {/* Trades table takes 2 columns (half width) */}
      <div className="trades-box">
        <TradesTable />
      </div>
    </div>
  );
};

export default Investment;
