// src/pages/Investment.js
import React from "react";
import { PortfolioTable } from "../components/InvestmentsComponent/PortfolioTable";
import { PortfolioGraph } from "../components/InvestmentsComponent/PortfolioGraph";
import { TradesTable } from "../components/InvestmentsComponent/TradesTable";
import { InvestmentProfile } from "../components/InvestmentsComponent/InvestmentProfile";
import { PortfolioDiversityChart } from "../components/InvestmentsComponent/PortfolioDiversityChart";

export const Investment = () => {
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
      <div className="profile-box">
        <InvestmentProfile />
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
