import { useState } from "react";
import SearchIcon from "../assets/Search.png";

export default function SearchBar({ searchTerm, setSearchTerm }) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpand = () => {
    setExpanded((prev) => !prev);
  };
  const handleBlur = () => {
    if (!searchTerm) setExpanded(false);
  };

  return (
    <div className={`search-bar-wrapper ${expanded ? "expanded" : ""}`}>
      <img
        src={SearchIcon}
        alt="Search"
        className="search-icon"
        onClick={toggleExpand}
      />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Symbol / Company"
        className="search-input"
        onBlur={handleBlur}
        autoFocus={expanded}
      />
    </div>
  );
}
