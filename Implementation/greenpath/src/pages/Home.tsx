import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      {/* --- Scoped styles for this page --- */}
      <style>{`
        /* Typography tokens for consistent sizes */
        :root {
          --fz-heading: clamp(24px, 3.2vw, 36px);
          --fz-body: clamp(15px, 1.9vw, 16px);
          --clr-heading: #0e5f3a;
          --clr-body: #223c2f;
        }

        /* General text defaults for this page */
        .pageBody {
          font-size: var(--fz-body);
          color: var(--clr-body);
          line-height: 1.6;
          letter-spacing: .1px;
        }

        .heading {
          font-size: var(--fz-heading);
          color: var(--clr-heading);
          font-weight: 900;
          line-height: 1.2;
          margin: 0 0 10px 0;
        }

        .subtle {
          opacity: .9;
        }

        /* Layout */
        .hero {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 24px;
          align-items: center;
        }

        .ctaRow {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 6px;
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

        /* Carousel wrapper: clean aspect, tidy border radius */
        .heroImageWrap {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 18px 40px rgba(0,0,0,0.08);
          aspect-ratio: 16 / 9;
          min-height: 260px;
          background: #e9f6ef;
        }
        /* Image fills nicely; choose 'cover' for edge-to-edge look */
        .heroImage {
          width: 100%;
          height: 100%;
          object-fit: cover;      /* change to 'contain' if you want no cropping */
          object-position: center;
          display: block;
        }
        .carouselTrack { position: relative; width: 100%; height: 100%; }
        .carouselSlide {
          position: absolute; inset: 0; opacity: 0;
          transition: opacity .35s ease;
          will-change: opacity;
        }
        .carouselSlide.active { opacity: 1; }

        /* Caption & dots BELOW the image (no overlay, no hover) */
        .carouselMeta { margin-top: 10px; }
        .capTitle {
          font-weight: 800;
          color: var(--clr-heading);
          font-size: calc(var(--fz-body) + 1px);
          margin: 0 0 2px 0;
        }
        .capSub { margin: 0; font-size: var(--fz-body); }
        .dotsRow { display: flex; gap: 8px; margin-top: 10px; align-items: center; }
        .dot {
          width: 10px; height: 10px; border-radius: 999px;
          background: #c3e6d2;
          border: 1px solid #127c4c80;
          cursor: pointer;
        }
        .dot.active { background: #127c4c; }

        /* About section styling */
        .aboutSection {
          margin-top: 28px;
          background: #ffffff;
          border: 1px solid #e6efe9;
          border-radius: 16px;
          padding: 18px;
          box-shadow: 0 10px 26px rgba(0,0,0,0.06);
        }
        .aboutTitle { composes: heading; } /* for dev tools clarity */

        /* “How it works” */
        .sectionTitle { composes: heading; }
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
          display: inline-flex; align-items: center; justify-content: center;
          width: 32px; height: 32px; border-radius: 999px;
          background: #127c4c; color: #fff; font-weight: 900; margin-bottom: 8px;
          box-shadow: 0 8px 18px rgba(18,124,76,0.25);
        }
        .stepTitle { font-weight: 800; color: #124a34; margin-bottom: 4px; font-size: var(--fz-body); }

        /* CTA */
        .ctaPanel {
          margin-top: 28px;
          background: linear-gradient(135deg, #127c4c, #14935a);
          color: #fff;
          border-radius: 16px;
          padding: 18px;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          box-shadow: 0 14px 36px rgba(18,124,76,0.28);
        }
        .ctaPanel h3 { margin: 0; font-size: var(--fz-heading); font-weight: 900; }
        .ctaPanel p  { margin: 2px 0 0; opacity: 0.95; font-size: var(--fz-body); }
        .ctaButtons  { display: flex; gap: 10px; flex-wrap: wrap; }

        @media (max-width: 900px) {
          .hero { grid-template-columns: 1fr; }
          .steps { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="pageBody">
        {/* HERO */}
        <section className="hero" aria-label="GreenPath introduction">
          <div>
            <h1 className="heading">Welcome to GreenPath</h1>
            <p className="subtle">
              A simple way to explore emissions trends, compare categories, and turn data into
              actionable sustainability insights.
            </p>
          </div>

          <ImageCarousel />
        </section>

        {/* ABOUT — immediately below hero */}
        <section className="aboutSection" aria-label="About GreenPath and sustainable products">
          <h2 className="heading">About GreenPath & Sustainable Products</h2>
          <p>
            We believe small choices lead to big change.
            Our world faces growing environmental challenges—from rising emissions to waste that harms ecosystems—
            but every sustainable product and every mindful decision is a step toward a healthier planet.
          </p>

          <p>
            <strong>What is GreenPath?</strong> GreenPath is your guide to exploring sustainable product options
            and understanding their impact. We provide data-driven insights into emissions, categories, and trends so you can:
          </p>
          <ul style={{ margin: "10px 0 0 18px" }}>
            <li>Make informed choices as a consumer.</li>
            <li>Understand the environmental footprint of everyday products.</li>
            <li>Discover eco-friendly alternatives that balance people, planet, and prosperity.</li>
          </ul>

          <p style={{ marginTop: 10 }}>
            <strong>Our Mission.</strong> We aim to simplify sustainability. By combining clear data visualizations,
            product categories, and an AI assistant, GreenPath helps turn complex environmental data into actionable insights.
            Whether you are a student, policymaker, business, or conscious shopper, GreenPath supports your journey toward a greener lifestyle.
          </p>
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
    </div>
  );
}

/* ---------- Carousel component: NO HOVER, caption below image ---------- */
function ImageCarousel() {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/+$/, "");
  const slides = React.useMemo(() => [
    { src: `${base}/details.jpg`,   alt: "Poster showcasing various eco product ideas",   title: "Practical Eco Ideas",    sub: "Reusable and recycled alternatives that work." },
    { src: `${base}/details2.jpg`,  alt: "Illustrations of sustainable product types",    title: "Explore Categories",     sub: "Drill into product types to find impact hotspots." },
    { src: `${base}/details3.jpeg`, alt: "Sustainable product considerations chart",      title: "Think Holistically",     sub: "Balance health, environment, workers, and economy." },
    { src: `${base}/details4.jpeg`, alt: "Unboxing sustainable products",                 title: "Choose Better Products", sub: "Spot greener choices that reduce footprint." },
    { src: `${base}/details5.jpeg`, alt: "Industrial stacks showing emissions challenges", title: "Understand Emissions",  sub: "See how emissions evolve across countries and years." },
  ], [base]);

  // Preload
  React.useEffect(() => {
    slides.forEach(s => { const im = new Image(); im.src = s.src; });
  }, [slides]);

  const [idx, setIdx] = React.useState(0);

  // Auto-advance every 2.5s (no pause-on-hover)
  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 2500);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div>
      {/* Image box */}
      <div className="heroImageWrap" aria-roledescription="carousel" aria-label="GreenPath highlights">
        <div className="carouselTrack" role="group" aria-live="polite">
          {slides.map((s, i) => (
            <img
              key={s.src}
              className={`heroImage carouselSlide ${i === idx ? "active" : ""}`}
              src={s.src}
              alt={s.alt}
            />
          ))}
        </div>
      </div>

      {/* Caption BELOW the image */}
      <div className="carouselMeta">
        <div className="capTitle">{slides[idx].title}</div>
        <p className="capSub subtle">{slides[idx].sub}</p>

        {/* Dots below caption */}
        <div className="dotsRow" aria-label="Slide indicators">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === idx ? "active" : ""}`}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIdx(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
