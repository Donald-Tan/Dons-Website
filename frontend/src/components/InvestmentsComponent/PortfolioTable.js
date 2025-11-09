import React from "react";
import { Table } from "./Table";
import API_ENDPOINTS from "../../config/api";

export const PortfolioTable = () => {
  const columns = [
    { label: "Ticker", key: "ticker" },
    { label: "Company", key: "name" },
    { label: "QTY", key: "quantity", align: "text-right" },
    { label: "Avg Buy", key: "avg_buy_price", align: "text-right" },
    { label: "Current", key: "current_price", align: "text-right" },
    { label: "Value", key: "market_value", align: "text-right" },
    { label: "Gain/Loss", key: "unrealized_gain_loss", align: "text-right" },
    { label: "%", key: "percent_change", align: "text-right" },
  ];

  return (
    <Table
      title="Portfolio"
      fetchUrl={API_ENDPOINTS.portfolio}
      columns={columns}
      rowsPerPage={10}
    />
  );
};
