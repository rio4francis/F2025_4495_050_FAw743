// src/pages/AnalyticsML.tsx
//import { Link } from "react-router-dom";

export default function AnalyticsML() {
  const styles = (
    <style>{`
      :root{
        --fz-heading: clamp(24px, 3.2vw, 36px);
        --fz-body: clamp(15px, 1.9vw, 16px);
        --clr-heading: #0e5f3a;
        --clr-body: #223c2f;
        --border: #e4efe8;
        --panel: #ffffff;
        --panel-soft: #f6fbf8;
        --green: #127c4c;
        --green-2:#14935a;
      }
      .pg { font-size: var(--fz-body); color: var(--clr-body); line-height: 1.6; letter-spacing:.1px; }
      .hd { font-size: var(--fz-heading); color: var(--clr-heading); font-weight: 900; line-height: 1.2; margin: 0 0 10px; }
      .subtle { opacity:.9; }

      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 16px;
        box-shadow: 0 10px 26px rgba(0,0,0,.06);
        padding: 16px;
      }

      .grid {
        display:grid; grid-template-columns: repeat(3, 1fr); gap:14px; margin-top:12px;
      }
      @media (max-width: 1000px){ .grid{ grid-template-columns: 1fr; } }

      .card { background:var(--panel-soft); border:1px solid var(--border); border-radius:14px; padding:16px; display:grid; gap:10px; }
      .card h3 { margin:0; color:var(--clr-heading); font-weight:900; }
      .pill {
        display:inline-block; font-size:12px; font-weight:800; letter-spacing:.2px;
        background: linear-gradient(135deg, var(--green), var(--green-2)); color:#fff;
        padding:4px 8px; border-radius:999px;
      }
      .btnRow { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
      .btn {
        display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:12px;
        text-decoration:none; font-weight:900; color:#fff;
        background: linear-gradient(135deg, var(--green), var(--green-2));
        border:1px solid rgba(18,124,76,.25);
        box-shadow:0 10px 22px rgba(18,124,76,.22);
      }
      .btnGhost {
        display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:12px;
        text-decoration:none; font-weight:900; color:var(--green);
        background:#eaf7f0; border:1px solid #cfe8dc;
      }
      .coming { opacity:.6; cursor:not-allowed; }
      .crumb { margin-bottom:8px; }
    `}</style>
  );

  return (
    <section className="pg">
      {styles}

     

      <h1 className="hd">ML Analytics</h1>
      <div className="panel" style={{ marginBottom: 10 }}>
        <p className="subtle" style={{ margin: 0 }}>
          Explore advanced analytics built on the same emissions dataset used in the dashboard.
          These modules will help you <strong>forecast future totals</strong>, understand
          <strong> what drives changes</strong>, and <strong>spot anomalies</strong> that may signal
          data quality issues or unusual events. This page is a scaffold—buttons can be wired to real
          back-end jobs or client-side models when you’re ready.
        </p>
      </div>

      <div className="grid">
        {/* 1) Forecasting */}
        <article className="card">
          <span className="pill">Forecasting</span>
          <h3>Country & Sector Forecasts</h3>
          <p className="subtle">
            Produce short-term projections for total or sector emissions (e.g., by
            ARIMA/Prophet). Useful for planning reduction targets and comparing “business-as-usual”
            to policy scenarios.
          </p>
          <div className="btnRow">
            <button className="btn coming" disabled aria-label="Run forecast (coming soon)">
              Run Forecast (coming soon)
            </button>
          </div>
        </article>

        {/* 2) Feature impact */}
        <article className="card">
          <span className="pill">Feature Impact</span>
          <h3>What Drives Emissions?</h3>
          <p className="subtle">
            Train a simple model on enriched features (e.g., GDP, population, energy mix) and
            explain contributions via permutation importance/SHAP. Helps prioritize sustainable
            product levers.
          </p>
          <div className="btnRow">
            <button className="btn coming" disabled aria-label="Analyze drivers (coming soon)">
              Analyze Drivers (coming soon)
            </button>
          </div>
        </article>

        {/* 3) Anomaly detection */}
        <article className="card">
          <span className="pill">Anomaly Detection</span>
          <h3>Outliers & Data Quality</h3>
          <p className="subtle">
            Flag unusual year-over-year changes using Isolation Forest or z-score rules. Useful for
            QA, revisions, or identifying shock events (e.g., policy/market disruptions).
          </p>
          <div className="btnRow">
            <button className="btn coming" disabled aria-label="Detect anomalies (coming soon)">
              Detect Anomalies (coming soon)
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
