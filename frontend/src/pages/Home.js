import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import homeHero from "../assets/homeHero.png";
import Education from "../components/Education";
import Work from "../components/Work";
import Projects from "../components/Projects";

const Home = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const parallaxOffset = scrollY * 0.5;

  return (
    <div className="portfolio-home">
      {/* Hero Section with Parallax */}
      <section className="hero-parallax">
        <div
          className="hero-parallax-bg"
          style={{
            backgroundImage: `url(${homeHero})`,
            transform: `translateY(${parallaxOffset}px)`,
          }}
        />
        <div className="hero-parallax-overlay" />

        <div className="hero-parallax-content">
          <h1 className="hero-parallax-title">Donald Tan</h1>
          <p className="hero-parallax-desc">
            Born in Malaysia, now based in Brooklyn, is a creative coder with a
            B.S. in Computer Science from the University of Washington. He turns
            ideas into digital experiences, blending design and function into
            interfaces people love to use.
          </p>
        </div>
        <button
          onClick={() =>
            document
              .getElementById("education")
              .scrollIntoView({ behavior: "smooth" })
          }
        >
          <div className="scroll-indicator">
            <ChevronDown className="scroll-icon" />
          </div>
        </button>
      </section>

      <Education />
      <Projects />
      <Work />
    </div>
  );
};

export default Home;
