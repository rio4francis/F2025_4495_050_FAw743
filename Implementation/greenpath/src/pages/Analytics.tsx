// src/pages/Analytics.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

type Row = { country: string; sector: string; year: number; value: number };

/** Normalize VITE_API_URL (no query, no trailing slash) and use as a base */
const API_BASE = ((import.meta as any).env?.VITE_API_URL || "")
  .replace(/\?.*$/, "")
  .replace(/\/+$/, "");

const CSV_URL = "/data/agg.csv"; // fallback when no API base available

const SECTORS = [
  "Power",
  "Industry",
  "Ground transport",
  "Residential",
  "Domestic aviation",
  "International aviation",
] as const;

const COLORS: Record<(typeof SECTORS)[number], string> = {
  Power: "#1f77b4",
  Industry: "#ff7f0e",
  "Ground transport": "#2ca02c",
  Residential: "#9467bd",
  "Domestic aviation": "#d62728",
  "International aviation": "#8c564b",
};

export default function Analytics() {
  /* ---------- styles (same tokens as Home for consistent font sizes) ---------- */
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
      }
      .pg { font-size: var(--fz-body); color: var(--clr-body); line-height: 1.6; letter-spacing:.1px; }
      .hd { font-size: var(--fz-heading); color: var(--clr-heading); font-weight: 900; line-height: 1.2; margin: 0 0 10px 0; }
      .subtle { opacity:.9; }
      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 16px;
        box-shadow: 0 10px 26px rgba(0,0,0,.06);
        padding: 16px;
      }
      .grid2 {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 16px;
      }
      @media (max-width: 960px){ .grid2{ grid-template-columns: 1fr; } }
      .label{ font-weight: 800; color: var(--clr-heading); margin-bottom: 4px; }
      .input{
        width: 100%; border: 1px solid var(--border); border-radius: 10px;
        padding: 10px 12px; font-size: var(--fz-body); outline: none;
      }
      .input:focus{ border-color: var(--green); box-shadow: 0 0 0 3px rgba(18,124,76,.12); }
      .btnTab{ padding: 6px 10px; border:1px solid var(--border); border-radius:10px; }
      .btnTab.active{ background:#e8eee9; }
      .chartWrap{
        height: 420px; border-radius: 14px; background: var(--panel-soft);
        border: 1px solid var(--border); padding: 8px;
      }
      .stats{ display:grid; grid-template-columns: repeat(3,1fr); gap:8px; margin-top:10px; }
      .stat{ background:#fff; border:1px solid var(--border); border-radius:12px; padding:10px; text-align:center; }
      .stat .k{ font-weight:900; color:var(--clr-heading); }
      .stat .v{ font-size:18px; font-weight:900; color:var(--green); }

      /* sections */
      .sectionHd{ font-size: var(--fz-heading); color: var(--clr-heading); font-weight: 900; margin: 24px 0 10px; }
      .steps{ display:grid; grid-template-columns: repeat(3,1fr); gap:12px; }
      .step{ background: var(--panel-soft); border:1px solid var(--border); border-radius:14px; padding:14px; }
      .badge{ width:32px; height:32px; border-radius:999px; display:grid; place-items:center; font-weight:900; color:#fff; background:var(--green); box-shadow:0 8px 18px rgba(18,124,76,.25); margin-bottom:6px; }
      @media (max-width: 900px){ .steps{ grid-template-columns: 1fr; } }
    `}</style>
  );

  // ----- hooks (your original logic)
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [country, setCountry] = useState<string>("WORLD");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const didInit = useRef(false);

  // one-time init
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    setLoading(true);
    setErr(null);

    if (API_BASE) {
      const load = async () => {
        try {
          // try to get countries (ok if missing)
          try {
            const r = await fetch(`${API_BASE}/countries`);
            if (r.ok) {
              const arr: string[] = await r.json();
              if (arr?.length) setCountries(arr);
            }
          } catch { /* ignore */ }

          const from = 2018, to = 2023;
          const res = await fetch(`${API_BASE}/agg?country=${encodeURIComponent(country)}&from=${from}&to=${to}`);
          if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
          const rows = await res.json();
          const mapped: Row[] = rows.map((d: any) => ({
            country,
            sector: String(d.sector),
            year: Number(d.year),
            value: Number(d.value),
          }));
          setAllRows(mapped);
        } catch (e: any) {
          setErr(e?.message || "Failed to load data from API");
        } finally {
          setLoading(false);
        }
      };
      load();
    } else {
      Papa.parse(CSV_URL, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (res) => {
          const rows = (res.data as any[]).map((r) => ({
            country: String(r.country),
            sector: String(r.sector),
            year: Number(r.year),
            value: Number(r.value),
          })) as Row[];
          setAllRows(rows);
          const cs = Array.from(new Set(rows.map(r => r.country))).sort();
          setCountries(cs);
          setLoading(false);
        },
        error: (e) => {
          setErr(e.message || "CSV parse error");
          setLoading(false);
        },
      });
    }
  }, []);

  // refetch on country change (API mode)
  useEffect(() => {
    if (!API_BASE) return;
    if (!country) return;

    setLoading(true);
    setErr(null);

    const from = 2018, to = 2023;
    fetch(`${API_BASE}/agg?country=${encodeURIComponent(country)}&from=${from}&to=${to}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`);
        return r.json();
      })
      .then((rows: Array<{ year: number; sector: string; value: number }>) => {
        const mapped: Row[] = rows.map(d => ({
          country,
          sector: String(d.sector),
          year: Number(d.year),
          value: Number(d.value),
        }));
        setAllRows(mapped);
        setLoading(false);
      })
      .catch((e) => {
        setErr(String(e));
        setLoading(false);
      });
  }, [country]);

  // derived views
  const rowsForCountry = useMemo(() => {
    return API_BASE ? allRows : allRows.filter(r => r.country === country);
  }, [allRows, country]);

  const years = useMemo(() => {
    const set = new Set(rowsForCountry.map(r => r.year));
    return Array.from(set).sort((a, b) => a - b);
  }, [rowsForCountry]);

  const wide = useMemo(() => {
    const byYear: Record<number, any> = {};
    for (const y of years) byYear[y] = { year: y };
    rowsForCountry.forEach(r => {
      if (!byYear[r.year]) byYear[r.year] = { year: r.year };
      (byYear[r.year] as any)[r.sector] = r.value;
    });
    return years.map(y => byYear[y]);
  }, [rowsForCountry, years]);

  // quick totals for stats (sum sectors per year)
  const stats = useMemo(() => {
    if (!wide.length) return null;
    const totals = wide.map(y => {
      let sum = 0;
      for (const s of SECTORS) sum += Number((y as any)[s] || 0);
      return sum;
    });
    const min = Math.min(...totals);
    const max = Math.max(...totals);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    return { min, max, avg };
  }, [wide]);

  /* ---------- UI ---------- */
  return (
    <section aria-labelledby="analytics-heading" className="pg">
      {styles}

      {/* 1) Header */}
      <h1 id="analytics-heading" className="hd">Analytics</h1>

      {/* NEW INTRO WRITE-UP (right below the heading) */}
      <p className="subtle" style={{ marginBottom: 12 }}>
        <strong>GreenPath Analytics</strong> provides a clear view of how various sectors and countries
        contribute to global emissions over time. By visualizing this data, users can understand which
        activities and industries have the largest environmental impact and where progress is being made.
        This insight is essential for promoting <strong>sustainable products and practices</strong>:
        when we see how emissions trends relate to energy use, transportation, and manufacturing, we can
        choose solutions that reduce carbon footprints, encourage cleaner production, and support long-term
        ecological balance. Ultimately, Analytics helps track the outcomes of sustainability initiatives and
        identify new opportunities for improvement.
      </p>

      {/* 2) About the Dataset (dataset-only details) */}
      <h2 className="sectionHd">About the Dataset</h2>
      <div className="panel" style={{ marginBottom: 8 }}>
        <p className="subtle" style={{ margin: 0 }}>
          <strong>Name:</strong> Global Emissions by Sector and Country Dataset<br/>
          <strong>Source:</strong> Kaggle — <em>Saloni1712</em><br/>
          <strong>What it contains:</strong> Annual greenhouse gas emissions (in GtCO₂) for major sectors
          (e.g., Power, Industry, Ground Transport, Residential, Domestic & International Aviation) across multiple
          countries and regions.<br/>
          <strong>Why we chose it:</strong> It provides clear, structured time-series data suitable for trend analysis
          and sector comparisons. These patterns help connect emissions to product life cycles, manufacturing activities,
          and consumption — enabling informed, sustainability-aligned decisions.
        </p>
      </div>

      {/* 3) How it works (write-up) */}
      <h2 className="sectionHd">How it works</h2>
      <div className="steps" style={{ marginBottom: 18 }}>
        <div className="step">
          <div className="badge">1</div>
          <div style={{ fontWeight: 800, color: "#124a34", marginBottom: 4 }}>Pick a country</div>
          <div>Select a prefered country to focus the dashboard.</div>
        </div>
        <div className="step">
          <div className="badge">2</div>
          <div style={{ fontWeight: 800, color: "#124a34", marginBottom: 4 }}>See trends instantly</div>
          <div>We query the API (or local CSV) and visualize the time series in a clean chart.</div>
        </div>
        <div className="step">
          <div className="badge">3</div>
          <div style={{ fontWeight: 800, color: "#124a34", marginBottom: 4 }}>Turn insights into action</div>
          <div>Use the observations to guide decisions and sustainability goals.</div>
        </div>
      </div>

      {/* 4) Controls + Chart (below all write-ups) */}
      <div className="grid2">
        {/* Controls */}
        <div className="panel">
          <div className="label">Country</div>
          <select
            className="input"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            aria-label="Country"
          >
            {(countries.length ? countries : ["WORLD", "US", "China", "EU27 & UK"]).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              className={`btnTab ${chartType === "line" ? "active" : ""}`}
              onClick={() => setChartType("line")}
            >
              Line
            </button>
            <button
              type="button"
              className={`btnTab ${chartType === "bar" ? "active" : ""}`}
              onClick={() => setChartType("bar")}
            >
              Bar
            </button>
          </div>

          {loading && <p style={{ marginTop: 10 }}>Loading…</p>}
          {err && <p style={{ marginTop: 10, color: "#8a1f11" }}>Error: {err}</p>}
        </div>

        {/* Chart */}
        <div className="panel">
          <div className="chartWrap" role="img" aria-label="Emissions time series chart">
            {!loading && !err ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                  <LineChart data={wide} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {SECTORS.map(s => (
                      <Line key={s} type="monotone" dataKey={s} stroke={COLORS[s]} dot />
                    ))}
                  </LineChart>
                ) : (
                  <BarChart data={wide} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {SECTORS.map(s => (
                      <Bar key={s} dataKey={s} fill={COLORS[s]} />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#6b7b72" }}>
                {loading ? "Loading data…" : (err || "No data")}
              </div>
            )}
          </div>

          {/* quick stats across sectors */}
          {stats && (
            <div className="stats">
              <div className="stat">
                <div className="k">Min total</div>
                <div className="v">{stats.min.toLocaleString()}</div>
              </div>
              <div className="stat">
                <div className="k">Avg total</div>
                <div className="v">{stats.avg.toFixed(2)}</div>
              </div>
              <div className="stat">
                <div className="k">Max total</div>
                <div className="v">{stats.max.toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
