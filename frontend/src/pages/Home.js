import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import homeHero from "../assets/homeHero.png";
import Education from "../components/Education";
import Work from "../components/Work";
import Projects from "../components/Projects";

const Home = () => {
  const [scrollY, setScrollY] = useState(0);
  const bgRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      const currentScroll = window.scrollY;

      if (!ticking) {
        rafRef.current = window.requestAnimationFrame(() => {
          setScrollY(currentScroll);
          if (bgRef.current) {
            const parallaxOffset = currentScroll * 0.5;
            bgRef.current.style.transform = `translate3d(0, ${parallaxOffset}px, 0)`;
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div className="portfolio-home">
      {/* Hero Section with Parallax */}
      <section className="hero-parallax">
        <div
          ref={bgRef}
          className="hero-parallax-bg"
          style={{
            backgroundImage: `url(${homeHero})`,
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
