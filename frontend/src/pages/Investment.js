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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent body scroll when card is flipped on mobile
  useEffect(() => {
    if (isMobile && isFlipped) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isFlipped]);

  const handleFlip = (e) => {
    if (isMobile) {
      // Don't flip if clicking on the scrollable story area
      if (e.target.closest('.scrollable-story')) {
        return;
      }
      setIsFlipped(!isFlipped);
    }
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
        onClick={handleFlip}
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
