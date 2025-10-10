import React from "react";
import { Table } from "./Table"; // reuse your Table wrapper

export const WatchlistTable = () => {
  const columns = [
    { label: "Ticker", key: "symbol" },
    { label: "Name", key: "name" },
    { label: "Price", key: "latest_price", align: "text-right" },
  ];

  const processRow = (w) => (
    <>
      <td className="table-symbol">
        <span>{w.symbol}</span>
      </td>
      <td>{w.name}</td>
      <td className="text-right">
        {w.latest_price !== null ? `$${w.latest_price.toFixed(2)}` : "-"}
      </td>
    </>
  );

  return (
    <Table
      title="Watchlist"
      fetchUrl="http://127.0.0.1:5000/api/portfolio/watchlist"
      columns={columns}
      processRow={processRow}
    />
  );
};

export default WatchlistTable;
