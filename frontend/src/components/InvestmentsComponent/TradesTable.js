// TradesTable.js (only small edits)
import React from "react";
import { Table } from "./Table";

export const TradesTable = () => {
  const columns = [
    { label: "Ticker", key: "ticker" },
    { label: "Company", key: "name" },
    { label: "Side", key: "side", align: "text-right" },
    { label: "QTY", key: "quantity", align: "text-right" },
    {
      label: "Price",
      key: "price",
      align: "text-right",
      render: (row) =>
        row.price != null ? `$${Number(row.price).toFixed(2)}` : "-",
    },
    {
      label: "Executed At",
      key: "executed_at",
      align: "text-right",
      render: (row) =>
        row.executed_at
          ? new Date(row.executed_at).toLocaleString("en-US", {
              dateStyle: "short",
              timeStyle: "",
            })
          : "-",
    },
  ];

  return (
    <Table
      title="Trades"
      fetchUrl="http://127.0.0.1:5000/api/portfolio/trades"
      columns={columns}
      rowsPerPage={10}
    />
  );
};
