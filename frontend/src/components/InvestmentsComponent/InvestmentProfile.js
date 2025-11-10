import React, { useEffect, useRef, useState } from "react";
import InvestmentPP from "../../assets/InvestmentProfile.png";

export const InvestmentProfile = ({ isFlipped, isMobile }) => {
  const cardRef = useRef(null);
  const [layout, setLayout] = useState("normal"); // normal, compact, mini

  useEffect(() => {
    const updateLayout = () => {
      if (cardRef.current) {
        const width = cardRef.current.getBoundingClientRect().width;

        if (width < 200) {
          setLayout("mini");
        } else if (width < 280) {
          setLayout("compact");
        } else {
          setLayout("normal");
        }
      }
    };

    updateLayout();

    const resizeObserver = new ResizeObserver(updateLayout);
    if (cardRef.current) {
      resizeObserver.observe(cardRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const getStyles = () => {
    switch (layout) {
      case "mini":
        return {
          row: {
            flexDirection: "column",
            gap: "8px",
            marginBottom: "0.8rem",
            alignItems: "center",
          },
          pic: {
            width: "3rem",
            height: "3rem",
          },
          nameAge: {
            alignItems: "center",
            textAlign: "center",
          },
          name: {
            fontSize: "0.85rem",
          },
          age: {
            fontSize: "0.75rem",
          },
          stats: {
            fontSize: "0.65rem",
            gap: "4px",
            justifyContent: "center",
          },
          story: {
            fontSize: "0.75rem",
            lineHeight: "1.4",
          },
        };
      case "compact":
        return {
          row: {
            flexDirection: "column",
            gap: "10px",
            marginBottom: "1rem",
            alignItems: "center",
          },
          pic: {
            width: "3.5rem",
            height: "3.5rem",
          },
          nameAge: {
            alignItems: "center",
            textAlign: "center",
          },
          name: {
            fontSize: "0.95rem",
          },
          age: {
            fontSize: "0.8rem",
          },
          stats: {
            fontSize: "0.7rem",
            gap: "5px",
            justifyContent: "center",
          },
          story: {
            fontSize: "0.8rem",
            lineHeight: "1.5",
          },
        };
      default:
        return {
          row: {
            flexDirection: "row",
            gap: "14px",
            marginBottom: "1.2rem",
            alignItems: "center",
          },
          pic: {
            width: "5rem",
            height: "5rem",
          },
          nameAge: {
            alignItems: "flex-start",
            textAlign: "left",
          },
          name: {
            fontSize: "1.1rem",
          },
          age: {
            fontSize: "0.9rem",
          },
          stats: {
            fontSize: "0.8rem",
            gap: "8px",
            justifyContent: "flex-start",
          },
          story: {
            fontSize: "0.95rem",
            lineHeight: "1.6",
          },
        };
    }
  };

  const styles = getStyles();

  return (
    <>
      {isMobile ? (
        <>
          {/* Front of card - Profile info */}
          <div ref={cardRef} className="flip-card-front">
            <div className="investment-profile-row" style={styles.row}>
              <img
                src={InvestmentPP}
                alt="Profile"
                className="profile-pic"
                style={styles.pic}
              />

              <div className="profile-name-age" style={styles.nameAge}>
                <span className="profile-name" style={styles.name}>
                  Donald Tan
                </span>
                <span className="profile-age" style={styles.age}>
                  Age: 22
                </span>
                <div className="profile-stats" style={styles.stats}>
                  <span>📈 7 Years</span>
                  <span>💻 Tech</span>
                  <span>🌍 Emerging Mkts</span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', opacity: 0.7 }}>
              Tap to read more
            </div>
          </div>

          {/* Back of card - Story */}
          <div className="flip-card-back">
            <div
              className="profile-story scrollable-story"
              style={{
                ...styles.story,
                overflowY: 'scroll',
                overflowX: 'hidden',
                flex: '1',
                display: 'flex',
                alignItems: 'flex-start',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                maxHeight: '100%',
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchMove={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
              }}
            >
              <p style={{ margin: 0, paddingRight: '0.5rem' }}>
                Investing since the age of 15, I have developed the mindset and
                knowledge required to become a thoughtful investor. Today, my approach
                blends those principles with analytical research inspired by investors
                and commentators such as Luke Lango, Louis Navellier, and Eric Fry
                (InvestorPlace). I focus on technology, emerging markets, and growth
                opportunities that align with long-term innovation.
              </p>
            </div>
          </div>
        </>
      ) : (
        <div ref={cardRef} className="investment-profile-card">
          {/* Desktop layout - show everything */}
          <div className="investment-profile-row" style={styles.row}>
            <img
              src={InvestmentPP}
              alt="Profile"
              className="profile-pic"
              style={styles.pic}
            />

            <div className="profile-name-age" style={styles.nameAge}>
              <span className="profile-name" style={styles.name}>
                Donald Tan
              </span>
              <span className="profile-age" style={styles.age}>
                Age: 22
              </span>
              <div className="profile-stats" style={styles.stats}>
                <span>📈 7 Years</span>
                <span>💻 Tech</span>
                <span>🌍 Emerging Mkts</span>
              </div>
            </div>
          </div>

          <div className="profile-story" style={styles.story}>
            <p>
              Investing since the age of 15, I have developed the mindset and
              knowledge required to become a thoughtful investor. Today, my approach
              blends those principles with analytical research inspired by investors
              and commentators such as Luke Lango, Louis Navellier, and Eric Fry
              (InvestorPlace). I focus on technology, emerging markets, and growth
              opportunities that align with long-term innovation.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
