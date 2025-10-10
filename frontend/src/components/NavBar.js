import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import github from "../assets/github.png";
import linkedin from "../assets/linkedin.png";
import facebook from "../assets/facebook.png";
import instagram from "../assets/instagram.png";

export const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ODOpen, setODOpen] = useState(false);
  const [mobileODOpen, setMobileODOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
    setODOpen(false);
    setMobileODOpen(false);
  }, [location]);

  const mainNavLinks = [
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
  ];

  const ODLinks = [
    { path: "/Investments", label: "Investments" },
    { path: "/Travel", label: "Travel" },
    { path: "/Featured", label: "Featured" },
  ];

  const isODActive = ODLinks.some((link) => isActive(link.path));

  const socialIcons = [
    { src: github, href: "https://github.com/Donald-Tan", alt: "GitHub" },
    {
      src: linkedin,
      href: "https://www.linkedin.com/in/donald-augustine-tan",
      alt: "LinkedIn",
    },
    {
      src: instagram,
      href: "https://www.instagram.com/donald.tannn",
      alt: "Instagram",
    },
    {
      src: facebook,
      href: "https://www.facebook.com/L1l.Don",
      alt: "Facebook",
    },
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="modern-navbar">
        <div className="modern-navbar-container">
          {/* Logo - Wrapped in a new flex container */}
          <div className="navbar-left-group">
            <Link
              to="/"
              className={`navbar-logo ${scrolled ? "scrolled" : ""}`}
            >
              DAT
            </Link>
          </div>

          {/* Center Navigation Links */}
          <div
            className={`navbar-center ${scrolled ? "scrolled" : ""} ${
              ODOpen ? "OD-open" : ""
            }`}
          >
            <div className="navbar-center-top">
              <Link
                to="/"
                className={`nav-item ${isActive("/") ? "active" : ""}`}
              >
                Home
              </Link>
              {mainNavLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                >
                  {item.label}
                </Link>
              ))}

              {/* OD Toggle Button */}
              <button
                className={`OD-toggle ${isODActive ? "active" : ""} ${
                  ODOpen ? "open" : ""
                }`}
                onClick={() => setODOpen(!ODOpen)}
              >
                OD
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  {ODOpen ? (
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  ) : (
                    <path
                      d="M3 12h18M3 6h18M3 18h18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
              </button>
            </div>

            {/* Dropdown Menu Inside Bubble */}
            <div className={`OD-dropdown ${ODOpen ? "open" : ""}`}>
              {ODLinks.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`OD-item ${isActive(item.path) ? "active" : ""}`}
                  onClick={() => setODOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Social Icons - Wrapped in a new flex container */}
          <div className="navbar-right-group">
            <div className={`navbar-social ${scrolled ? "scrolled" : ""}`}>
              {socialIcons.map((icon, idx) => (
                <a
                  key={idx}
                  href={icon.href}
                  target="_blank"
                  rel="noreferrer"
                  className="social-link"
                >
                  <img src={icon.src} alt={icon.alt} />
                </a>
              ))}
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`mobile-menu-toggle ${scrolled ? "scrolled" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 12h18M3 6h18M3 18h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <div className="mobile-menu-content">
          {/* Navigation Links */}
          <div className="mobile-nav-links">
            <Link
              to="/"
              className={`mobile-nav-item ${isActive("/") ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            {mainNavLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-item ${
                  isActive(item.path) ? "active" : ""
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile OD */}
            <div className="mobile-OD">
              <button
                className="mobile-OD-toggle"
                onClick={() => setMobileODOpen(!mobileODOpen)}
              >
                OD
                <span className={mobileODOpen ? "mobile-x" : "mobile-burger"}>
                  {mobileODOpen ? "✕" : "☰"}
                </span>
              </button>

              {/* Mobile OD Dropdown */}
              <div
                className={`mobile-OD-dropdown ${mobileODOpen ? "open" : ""}`}
              >
                {ODLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`mobile-OD-item ${
                      isActive(item.path) ? "active" : ""
                    }`}
                    onClick={() => {
                      setMenuOpen(false);
                      setMobileODOpen(false);
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Social Icons */}
          <div className="mobile-social-icons">
            {socialIcons.map((icon, idx) => (
              <a
                key={idx}
                href={icon.href}
                target="_blank"
                rel="noreferrer"
                className="mobile-social-link"
              >
                <img src={icon.src} alt={icon.alt} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
