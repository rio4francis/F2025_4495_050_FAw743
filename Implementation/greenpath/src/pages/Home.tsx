import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      {/* Scoped styles for this page */}
      <style>{`
        .hero {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 24px;
          align-items: center;
        }
        .heroTitle {
          font-size: clamp(28px, 4vw, 44px);
          line-height: 1.15;
          color: #0e5f3a;
          font-weight: 900;
          margin: 0 0 10px 0;
        }
        .heroSub {
          font-size: clamp(16px, 2.2vw, 18px);
          color: #1b3a2c;
          opacity: 0.9;
          margin: 0 0 18px 0;
        }
        .ctaRow {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btnPrimary {
          background: #127c4c;
          color: #fff;
          font-weight: 800;
          border: 1px solid rgba(255,255,255,0.5);
          border-radius: 14px;
          padding: 12px 18px;
          text-decoration: none;
          box-shadow: 0 8px 18px rgba(18,124,76,0.2);
          transition: transform .08s ease, box-shadow .12s ease, background .12s ease;
        }
        .btnPrimary:hover { background: #0f6a41; box-shadow: 0 10px 22px rgba(18,124,76,0.28); }
        .btnPrimary:active { transform: translateY(1px); }

        .btnGhost {
          background: #ffffff;
          color: #127c4c;
          font-weight: 800;
          border: 1px solid #127c4c55;
          border-radius: 14px;
          padding: 12px 18px;
          text-decoration: none;
          transition: transform .08s ease, box-shadow .12s ease;
        }
        .btnGhost:hover { box-shadow: 0 8px 18px rgba(0,0,0,0.06); }
        .btnGhost:active { transform: translateY(1px); }

        .heroImageWrap {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          background: linear-gradient(145deg, #e6f5ed, #f8fffb);
          box-shadow: 0 18px 40px rgba(0,0,0,0.08);
          min-height: 240px;
        }
        .heroImage {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .sectionTitle {
          font-size: clamp(22px, 3vw, 28px);
          color: #0e5f3a;
          font-weight: 900;
          margin: 28px 0 14px 0;
        }

        .cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .card {
          background: #ffffff;
          border: 1px solid #e8efe9;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 10px 26px rgba(0,0,0,0.06);
        }
        .cardTitle {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          color: #0f6a41;
          margin-bottom: 6px;
          font-size: 18px;
        }
        .cardBody {
          color: #243b30;
          opacity: 0.9;
          font-size: 15px;
          line-height: 1.55;
        }

        .steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .step {
          background: #f6fbf8;
          border: 1px solid #e1efe7;
          border-radius: 14px;
          padding: 16px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 999px;
          background: #127c4c;
          color: #fff;
          font-weight: 900;
          margin-bottom: 8px;
          box-shadow: 0 8px 18px rgba(18,124,76,0.25);
        }
        .stepTitle { font-weight: 800; color: #124a34; margin-bottom: 4px; }

        .ctaPanel {
          margin-top: 28px;
          background: linear-gradient(135deg, #127c4c, #14935a);
          color: #fff;
          border-radius: 16px;
          padding: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 14px 36px rgba(18,124,76,0.28);
        }
        .ctaPanel h3 { margin: 0; font-size: clamp(18px, 2.4vw, 22px); font-weight: 900; }
        .ctaPanel p { margin: 2px 0 0; opacity: 0.92; }
        .ctaButtons { display: flex; gap: 10px; flex-wrap: wrap; }

        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; }
          .cards { grid-template-columns: 1fr; }
          .steps { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* HERO */}
      <section className="hero" aria-label="GreenPath introduction">
        <div>
          <h1 className="heroTitle">Welcome to GreenPath</h1>
          <p className="heroSub">
            A simple way to explore emissions trends, compare categories, and turn data
            into actionable sustainability insights.
          </p>

          <div className="ctaRow">
            <Link to="/analytics" className="btnPrimary">Open Analytics</Link>
            <Link to="/categories" className="btnGhost">Browse Categories</Link>
          </div>
        </div>

        <div className="heroImageWrap" aria-hidden="true">
          {/* Put an image in /public/hero-greenpath.jpg (or use your own file name) */}
          <img
            className="heroImage"
            src="/hero-greenpath.jpg"
            alt="Abstract green data waves representing sustainability analytics"
            onError={(e) => {
              // Fallback: subtle SVG if the image isn’t present yet
              (e.currentTarget as HTMLImageElement).outerHTML = `
                <svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stop-color="#dff3e8"/>
                      <stop offset="100%" stop-color="#f8fffb"/>
                    </linearGradient>
                  </defs>
                  <rect width="800" height="480" fill="url(#g)"/>
                  <path d="M0,360 C150,300 300,420 450,360 C600,300 650,380 800,340 L800,480 L0,480 Z"
                        fill="#bfe7d1" opacity="0.8"/>
                  <path d="M0,380 C140,340 320,440 480,380 C640,320 700,380 800,370 L800,480 L0,480 Z"
                        fill="#9fdbbd" opacity="0.8"/>
                  <text x="50" y="80" font-size="28" font-weight="800" fill="#127c4c">
                    Visualize • Compare • Act
                  </text>
                </svg>`;
            }}
          />
        </div>
      </section>

      {/* OBJECTIVES */}
      <section aria-label="Objectives">
        <h2 className="sectionTitle">What you can do with GreenPath</h2>

        <div className="cards">
          <div className="card">
            <div className="cardTitle">
              {/* leaf icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#127c4c" aria-hidden="true">
                <path d="M5 3c9 0 14 5 14 14 0 .6-.4 1-1 1-9 0-14-5-14-14 0-.6.4-1 1-1zM7 7c2 4 6 6 10 7-1 4-5 7-9 7-4 0-7-3-7-7 0-4 3-7 6-7z"/>
              </svg>
              Track Emissions
            </div>
            <p className="cardBody">
              Explore country-level trends over time. Choose a year range and instantly see aggregated results.
            </p>
          </div>

          <div className="card">
            <div className="cardTitle">
              {/* compare icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#127c4c" aria-hidden="true">
                <path d="M4 4h4v16H4V4zm12 0h4v16h-4V4zM10 10h4v10h-4V10z"/>
              </svg>
              Compare Categories
            </div>
            <p className="cardBody">
              Break down metrics by category (coming soon) to spot hotspots and opportunities to improve.
            </p>
          </div>

          <div className="card">
            <div className="cardTitle">
              {/* chat/ai icon */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#127c4c" aria-hidden="true">
                <path d="M2 3h20v12H6l-4 4V3z"/>
              </svg>
              Ask the AI Assistant
            </div>
            <p className="cardBody">
              Get guided insights and plain-language explanations for your analytics results.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section aria-label="How it works">
        <h2 className="sectionTitle">How it works</h2>

        <div className="steps">
          <div className="step">
            <div className="badge">1</div>
            <div className="stepTitle">Pick a country & years</div>
            <div>Select your country and year range to focus the dashboard.</div>
          </div>
          <div className="step">
            <div className="badge">2</div>
            <div className="stepTitle">See trends instantly</div>
            <div>We query the API and visualize the time series in a clean chart.</div>
          </div>
          <div className="step">
            <div className="badge">3</div>
            <div className="stepTitle">Turn insights into action</div>
            <div>Use the observations to guide decisions and sustainability goals.</div>
          </div>
        </div>
      </section>

      {/* CTA PANEL */}
      <section className="ctaPanel" aria-label="Call to action">
        <div>
          <h3>Ready to explore real data?</h3>
          <p>Jump into Analytics or browse Categories to get started.</p>
        </div>
        <div className="ctaButtons">
          <Link to="/analytics" className="btnPrimary">Open Analytics</Link>
          <Link to="/categories" className="btnGhost">Browse Categories</Link>
        </div>
      </section>
    </div>
  );
}
