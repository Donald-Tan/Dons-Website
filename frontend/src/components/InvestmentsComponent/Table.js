import React, { useState, useEffect } from "react";
import SearchBar from "../SearchBar";

export const Table = ({ title, fetchUrl, columns }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    let mounted = true;

    const fetchData = async (showLoading = false) => {
      try {
        if (showLoading) setLoading(true);
        const res = await fetch(fetchUrl);
        const json = await res.json();
        if (!mounted) return;
        if (Array.isArray(json)) {
          setData(json);
          setError("");
        } else if (json && json.error) {
          setError(json.error);
          setData([]);
        } else {
          setError("Unexpected response from server.");
          setData([]);
        }
      } catch (e) {
        if (mounted) {
          setError("Failed to fetch data.");
          setData([]);
        }
      } finally {
        if (mounted && showLoading) setLoading(false);
      }
    };

    fetchData(true);
    const interval = setInterval(() => fetchData(false), 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchUrl]);

  // Helper function to determine if a value is gain/loss and apply appropriate class
  const getValueClass = (columnKey, value) => {
    if (
      columnKey === "unrealized_gain_loss" ||
      columnKey === "percent_change"
    ) {
      const numValue = parseFloat(value);
      console.log(
        `Column: ${columnKey}, Value: ${value}, Parsed: ${numValue}, Class: ${
          numValue >= 0 ? "gain" : "loss"
        }`
      );
      if (!isNaN(numValue)) {
        return numValue >= 0 ? "gain" : "loss";
      }
    }
    return "";
  };

  // Format value with proper sign and styling
  const formatValue = (columnKey, value) => {
    if (
      columnKey === "unrealized_gain_loss" ||
      columnKey === "percent_change"
    ) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return numValue >= 0 ? `+${value}` : value;
      }
    }
    return value;
  };

  const filteredData = data.filter((row) =>
    columns.some((col) =>
      String(row[col.key] ?? "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => setCurrentPage(1), [searchTerm]);

  return (
    <div className="table-container">
      {/* Header */}
      <div className="table-header">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <div className="table-title">{title}</div>
      </div>

      {/* Table */}
      <div className="table-wrapper" style={{ position: "relative" }}>
        {loading && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
            pointerEvents: "none"
          }}>
            <div className="loader" />
          </div>
        )}
        <table className="table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={col.align || ""}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ height: "400px", textAlign: "center" }}>
                  {/* Loader is rendered above in the table-wrapper */}
                </td>
              </tr>
            ) : error || !data.length ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center text-red-500"
                >
                  Failed to fetch data
                </td>
              </tr>
            ) : (
              // Always render `rowsPerPage` rows
              Array.from({ length: rowsPerPage }).map((_, rowIdx) => {
                const row = paginatedData[rowIdx];
                return (
                  <tr key={rowIdx}>
                    {columns.map((col, colIdx) => {
                      const value = row ? row[col.key] ?? "" : "";
                      const valueClass = row
                        ? getValueClass(col.key, value)
                        : "";
                      const displayValue = row
                        ? formatValue(col.key, value)
                        : "\u00A0";

                      console.log(
                        `Rendering cell - Column: ${col.key}, Value: ${value}, Class: ${valueClass}`
                      );

                      return (
                        <td
                          key={colIdx}
                          className={`${col.align || ""} ${valueClass}`.trim()}
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        >
          ◀
        </button>
        <span>
          {currentPage} / {totalPages || 1}
        </span>
        <button
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        >
          ▶
        </button>
      </div>
    </div>
  );
};
