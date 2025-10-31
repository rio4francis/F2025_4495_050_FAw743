// src/pages/Analytics.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Papa from "papaparse";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import UnifiedRankingTable from "../components/UnifiedRankingTable";
import TopFiveSnapshot from "../components/TopFiveSnapshot";

type Row = { country: string; sector: string; year: number; value: number };
type CumItem = { country: string; total: number };

/** Normalize VITE_API_URL (no query, no trailing slash) and use as a base */
const API_BASE = ((import.meta as any).env?.VITE_DATA_API_URL || "")
  .replace(/\?.*$/, "")
  .replace(/\/+$/, "");

const CSV_URL = "/data/agg.csv";

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
      .hd, .sectionHd { font-size: var(--fz-heading); color: var(--clr-heading); font-weight: 900; line-height: 1.2; margin: 0 0 10px 0; }
      .sectionHd{ margin: 24px 0 10px; }
      .subtle { opacity:.9; }

      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 16px;
        box-shadow: 0 10px 26px rgba(0,0,0,.06);
        padding: 16px;
      }

      .grid2 { display: grid; grid-template-columns: 320px 1fr; gap: 16px; }
      .grid2_equal { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      @media (max-width: 960px){ .grid2{ grid-template-columns: 1fr; } .grid2_equal{ grid-template-columns: 1fr; } }

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

      .steps{ display:grid; grid-template-columns: repeat(3,1fr); gap:12px; }
      .step{ background: var(--panel-soft); border:1px solid var(--border); border-radius:14px; padding:14px; }
      .badge{ width:32px; height:32px; border-radius:999px; display:grid; place-items:center; font-weight:900; color:#fff; background:var(--green); box-shadow:0 8px 18px rgba(18,124,76,.25); margin-bottom:6px; }
      @media (max-width: 900px){ .steps{ grid-template-columns: 1fr; } }

      /* CTA */
      .cta { display:flex; align-items:center; gap:12px; border:1px dashed var(--border); background:var(--panel); border-radius:14px; padding:14px; }
      .ctaRow { display:flex; align-items:center; justify-content:space-between; gap:12px; }
      .ctaBtn {
        display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:12px; text-decoration:none; color:#fff; font-weight:900;
        background: linear-gradient(135deg, var(--green), var(--green-2));
        box-shadow: 0 10px 22px rgba(18,124,76,.22);
        border:1px solid rgba(18,124,76,.25);
      }
    `}</style>
  );

  // -------- data hooks ----------
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [country, setCountry] = useState<string>("WORLD");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const didInit = useRef(false);

  // NEW: Top-5 cumulative (all years) for the small table + chart
  const [top5Cum, setTop5Cum] = useState<CumItem[]>([]);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    setLoading(true);
    setErr(null);

    if (API_BASE) {
      (async () => {
        try {
          try {
            const r = await fetch(`${API_BASE}/countries`);
            if (r.ok) {
              const arr: string[] = await r.json();
              if (arr?.length) setCountries(arr);
            }
          } catch {}

          const from = 2018, to = 2023;
          const res = await fetch(`${API_BASE}/agg?country=${encodeURIComponent(country)}&from=${from}&to=${to}`);
          if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
          const rows = await res.json();
          setAllRows(rows.map((d: any) => ({
            country,
            sector: String(d.sector),
            year: Number(d.year),
            value: Number(d.value),
          })));
        } catch (e: any) {
          setErr(e?.message || "Failed to load data from API");
        } finally {
          setLoading(false);
        }
      })();
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
          const cs = Array.from(new Set(rows.map((r) => r.country))).sort();
          setCountries(cs);
          setLoading(false);

          // Compute Top-5 cumulative (all years) from CSV
          const totals = new Map<string, number>();
          rows.forEach((r) => {
            totals.set(r.country, (totals.get(r.country) || 0) + r.value);
          });
          const top = Array.from(totals.entries())
            .map(([country, total]) => ({ country, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
          setTop5Cum(top);
        },
        error: (e) => {
          setErr(e.message || "CSV parse error");
          setLoading(false);
        },
      });
    }
  }, []);

  useEffect(() => {
    if (!API_BASE || !country) return;
    setLoading(true);
    setErr(null);

    const from = 2018, to = 2023;
    fetch(`${API_BASE}/agg?country=${encodeURIComponent(country)}&from=${from}&to=${to}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`);
        return r.json();
      })
      .then((rows: Array<{ year: number; sector: string; value: number }>) => {
        setAllRows(rows.map((d) => ({
          country,
          sector: String(d.sector),
          year: Number(d.year),
          value: Number(d.value),
        })));
        setLoading(false);
      })
      .catch((e) => {
        setErr(String(e));
        setLoading(false);
      });
  }, [country]);

  const rowsForCountry = useMemo(
    () => (API_BASE ? allRows : allRows.filter((r) => r.country === country)),
    [allRows, country]
  );

  const years = useMemo(() => {
    const set = new Set(rowsForCountry.map((r) => r.year));
    return Array.from(set).sort((a, b) => a - b);
  }, [rowsForCountry]);

  const wide = useMemo(() => {
    const byYear: Record<number, any> = {};
    for (const y of years) byYear[y] = { year: y };
    rowsForCountry.forEach((r) => {
      if (!byYear[r.year]) byYear[r.year] = { year: r.year };
      (byYear[r.year] as any)[r.sector] = r.value;
    });
    return years.map((y) => byYear[y]);
  }, [rowsForCountry, years]);

  const stats = useMemo(() => {
    if (!wide.length) return null;
    const totals = wide.map((y) => {
      let sum = 0;
      for (const s of SECTORS) sum += Number((y as any)[s] || 0);
      return sum;
    });
    const min = Math.min(...totals);
    const max = Math.max(...totals);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    return { min, max, avg };
  }, [wide]);

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <section aria-labelledby="analytics-heading" className="pg">
      {styles}

      <h1 id="analytics-heading" className="hd">Emissions Analytics</h1>

      <p className="subtle" style={{ marginBottom: 12 }}>
        <strong>GreenPath Analytics</strong> provides a clear view of how various sectors and countries
        contribute to global emissions over time, helping you spot high-impact areas and progress.
      </p>

      {/* About the dataset */}
      <h2 className="sectionHd">About the Dataset</h2>
      <div className="panel" style={{ marginBottom: 10 }}>
        <p className="subtle" style={{ margin: 0 }}>
          <strong>Name:</strong> Global Emissions by Sector and Country Dataset<br />
          <strong>Source:</strong> Kaggle — <em>Saloni1712</em><br />
          <strong>What it contains:</strong> Annual greenhouse gas emissions (in GtCO₂) for major sectors
          across multiple countries and regions.<br />
          <strong>Why we chose it:</strong> clean, structured time series for trend and sector comparisons.
        </p>
      </div>

      {/* NEW: Top-5 Snapshot block (table + chart side-by-side) */}
      <div className="grid2_equal">
        {/* Left: compact table */}
        <div className="panel">
          <h3 className="sectionHd" style={{ marginTop: 0 }}>Top 5 — Table (Cumulative)</h3>
          <p className="subtle" style={{ marginTop: 0 }}>
            Highest overall totals summed across all years in the dataset (GtCO₂).
          </p>
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <table className="min-w-[420px] w-full">
              <thead style={{ background: "rgba(16,185,129,.10)" }}>
                <tr>
                  <th className="text-left px-3 py-2">#</th>
                  <th className="text-left px-3 py-2">Country</th>
                  <th className="text-left px-3 py-2">Total (GtCO₂)</th>
                </tr>
              </thead>
              <tbody>
                {top5Cum.map((r, i) => (
                  <tr key={r.country} style={{ borderTop: "1px solid var(--border)" }}>
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">{r.country}</td>
                    <td className="px-3 py-2 font-semibold">{fmt(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: colored horizontal bars (highest→lowest) */}
        <div className="panel">
          <h3 className="sectionHd" style={{ marginTop: 0 }}>Top 5 — Visual (Cumulative)</h3>
          <TopFiveSnapshot data={top5Cum} />
        </div>
      </div>

      {/* Ranking overview (existing) */}
      <h2 className="sectionHd">Ranking Overview</h2>
      <p className="subtle" style={{ marginTop: 0, marginBottom: 8 }}>
        Quickly compare countries by total or sector-specific emissions for a selected year. Switch tabs inside
        the table to view rankings or latest totals and spot high-impact regions before exploring trends.
      </p>

      <UnifiedRankingTable />

      {/* Visualization guide (existing) */}
      <h2 className="sectionHd">Visualization Guide</h2>
      <p className="subtle" style={{ marginTop: 0, marginBottom: 0 }}>
        The charts below visualize sector trends for a chosen country (2018–2023). Use Line/Bar to switch
        views and look for turning points or persistent growth—great cues for where sustainable action matters.
      </p>

      {/* How it works (existing) */}
      <h2 className="sectionHd">How it Works</h2>
      <div className="steps" style={{ marginBottom: 18 }}>
        <div className="step">
          <div className="badge">1</div>
          <div style={{ fontWeight: 800, color: "#124a34", marginBottom: 4 }}>Pick a Country</div>
          <div>Select a preferred country to focus the dashboard.</div>
        </div>
        <div className="step">
          <div className="badge">2</div>
          <div style={{ fontWeight: 800, color: "#124a34", marginBottom: 4 }}>See Trends Instantly</div>
          <div>We query the API (or local CSV) and visualize the time series in clean charts.</div>
        </div>
        <div className="step">
          <div className="badge">3</div>
          <div style={{ fontWeight: 800, color: "#124a34", marginBottom: 4 }}>Turn Insights into Action</div>
          <div>Use observations to guide decisions and sustainability goals.</div>
        </div>
      </div>

      {/* Controls + Chart (existing) */}
      <div className="grid2">
        <div className="panel">
          <div className="label">Country</div>
          <select className="input" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country">
            {(countries.length ? countries : ["WORLD", "US", "China", "EU27 & UK"]).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" className={`btnTab ${chartType === "line" ? "active" : ""}`} onClick={() => setChartType("line")}>
              Line
            </button>
            <button type="button" className={`btnTab ${chartType === "bar" ? "active" : ""}`} onClick={() => setChartType("bar")}>
              Bar
            </button>
          </div>

          {loading && <p style={{ marginTop: 10 }}>Loading…</p>}
          {err && <p style={{ marginTop: 10, color: "#8a1f11" }}>Error: {err}</p>}
        </div>

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
                    {SECTORS.map((s) => (
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
                    {SECTORS.map((s) => (
                      <Bar key={s} dataKey={s} fill={COLORS[s]} />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#6b7b72" }}>
                {loading ? "Loading data…" : err || "No data"}
              </div>
            )}
          </div>

          {stats && (
            <div className="stats">
              <div className="stat"><div className="k">Min Total</div><div className="v">{stats.min.toLocaleString()}</div></div>
              <div className="stat"><div className="k">Avg Total</div><div className="v">{stats.avg.toFixed(2)}</div></div>
              <div className="stat"><div className="k">Max Total</div><div className="v">{stats.max.toLocaleString()}</div></div>
            </div>
          )}

          <div
            style={{
              marginTop: "12px",
              fontSize: "14px",
              color: "#4b6256",
              background: "#f6fbf8",
              border: "1px solid #e4efe8",
              borderRadius: "8px",
              padding: "10px 12px",
              lineHeight: 1.5,
            }}
          >
            💡 <strong>Note:</strong> “<strong>WORLD</strong>” represents the total global emissions (sum of all countries and
            regions). “<strong>ROW</strong>” refers to the <em>Rest of the World</em> — all other countries not listed individually.
          </div>
        </div>
      </div>

      {/* CTA to ML sub-page (existing) */}
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="ctaRow">
          <p className="subtle" style={{ margin: 0 }}>
            <strong>Would you like to explore more analytics?</strong> Try our upcoming machine-learning analytics to forecast trends and detect emission drivers.
          </p>
          <Link to="/analytics/ml" className="ctaBtn" aria-label="Open ML Analytics">
            Open ML Analytics →
          </Link>
        </div>
      </div>
    </section>
  );
}
