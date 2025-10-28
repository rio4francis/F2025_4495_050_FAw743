// src/pages/AnalyticsML.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
} from "recharts";

/** ====== CONFIG (matches the rest of your app) ====== */
type Row = { country: string; sector: string; year: number; value: number };

const API_BASE = ((import.meta as any).env?.VITE_DATA_API_URL || "")
  .replace(/\?.*$/, "")
  .replace(/\/+$/, "");

const CSV_URL = "/data/agg.csv";

const SECTORS = [
  "Total (all sectors)",
  "Power",
  "Industry",
  "Ground transport",
  "Residential",
  "Domestic aviation",
  "International aviation",
] as const;

const GP = {
  green: "#127c4c",
  green2: "#14935a",
  ink: "#223c2f",
  soft: "#f6fbf8",
  border: "#e4efe8",
};

function fmt(n: number, digits = 2) {
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

/** ====== SIMPLE ML: Holt’s Linear (double exp smoothing) ====== 
 * Returns smoothed level, trend, and h-step forecasts.
 * Alpha, beta in [0,1]. Choose (0.4, 0.3) as sensible defaults for short series.
 */
function holtLinear(series: number[], h: number, alpha = 0.4, beta = 0.3) {
  if (series.length < 2) {
    return { forecasts: Array(h).fill(series[series.length - 1] || 0), level: 0, trend: 0 };
  }
  let l = series[0];
  let b = series[1] - series[0];

  for (let t = 1; t < series.length; t++) {
    const y = series[t];
    const l_prev = l;
    l = alpha * y + (1 - alpha) * (l + b);
    b = beta * (l - l_prev) + (1 - beta) * b;
  }

  const forecasts = Array.from({ length: h }, (_, i) => l + (i + 1) * b);
  return { forecasts, level: l, trend: b };
}

/** Anomaly detection on YoY deltas using z-score (> 2.0) */
function detectAnomalies(years: number[], values: number[]) {
  if (years.length < 4) return [];
  const deltas = [];
  for (let i = 1; i < values.length; i++) deltas.push(values[i] - values[i - 1]);
  const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const sd = Math.sqrt(
    deltas.reduce((a, d) => a + Math.pow(d - mean, 2), 0) / Math.max(1, deltas.length - 1)
  );
  const z = (d: number) => (sd === 0 ? 0 : (d - mean) / sd);

  const anomalies: Array<{ year: number; value: number; z: number }> = [];
  for (let i = 1; i < years.length; i++) {
    const dz = z(values[i] - values[i - 1]);
    if (Math.abs(dz) >= 2) {
      anomalies.push({ year: years[i], value: values[i], z: dz });
    }
  }
  return anomalies;
}

export default function AnalyticsML() {
  const styles = (
    <style>{`
      :root{
        --heading: clamp(24px, 3.2vw, 36px);
        --body: clamp(15px, 1.9vw, 16px);
      }
      .pg{ font-size:var(--body); color:${GP.ink}; line-height:1.6; }
      .hd{ font-size:var(--heading); font-weight:900; color:${GP.green}; margin:0 0 8px 0; }
      .panel{ background:#fff; border:1px solid ${GP.border}; border-radius:16px; padding:14px;
              box-shadow:0 10px 26px rgba(0,0,0,.06); }
      .soft{ background:${GP.soft}; border:1px solid ${GP.border}; border-radius:14px; padding:10px; }
      .grid2{ display:grid; grid-template-columns: 320px 1fr; gap:14px; }
      @media (max-width: 980px){ .grid2{ grid-template-columns:1fr; } }
      .label{ font-weight:900; color:${GP.green}; margin-bottom:6px; }
      .input{ width:100%; border:1px solid ${GP.border}; border-radius:10px; padding:8px 10px; }
      .btn{ display:inline-flex; align-items:center; gap:8px; border-radius:10px; color:#fff;
            padding:10px 14px; font-weight:900;
            background:linear-gradient(135deg, ${GP.green}, ${GP.green2});
            border:1px solid rgba(18,124,76,.20); }
      .kpi{ display:grid; grid-template-columns: repeat(3,1fr); gap:10px; margin-top:10px; }
      .tile{ background:#fff; border:1px solid ${GP.border}; border-radius:12px; padding:10px; text-align:center; }
      .tile .t{ font-size:13px; opacity:.8; }
      .tile .v{ font-size:18px; font-weight:900; color:${GP.green}; }
      .cap{ margin-top:8px; font-size:13px; color:#4b6256; }
      .tag{ display:inline-block; padding:2px 8px; border:1px solid ${GP.border}; border-radius:999px; margin-left:8px; font-weight:700; }
      table{ width:100%; border-collapse:collapse; }
      th, td{ padding:8px 10px; border-top:1px solid ${GP.border}; }
      thead th{ background:#eef8f1; color:#0e5f3a; font-weight:800; }
    `}</style>
  );

  // ---- data ----
  const [all, setAll] = useState<Row[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [country, setCountry] = useState<string>("WORLD");
  const [sector, setSector] = useState<(typeof SECTORS)[number]>("Total (all sectors)");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const did = useRef(false);

  // Load data once (prefer API if configured)
  useEffect(() => {
    if (did.current) return;
    did.current = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        if (API_BASE) {
          // Fetch years in range to align with Analytics (2018..2023)
          const from = 2018, to = 2023;
          const list = await fetch(`${API_BASE}/countries`).then(r => r.ok ? r.json() : []);
          const rows = await fetch(`${API_BASE}/agg?country=${encodeURIComponent(country)}&from=${from}&to=${to}`)
            .then(async r => {
              if (!r.ok) throw new Error(await r.text());
              return r.json();
            });
          const shaped = (rows as any[]).map(d => ({
            country,
            sector: String(d.sector),
            year: Number(d.year),
            value: Number(d.value),
          })) as Row[];
          setAll(shaped);
          if (Array.isArray(list) && list.length) setCountries(list);
        } else {
          await new Promise<void>((resolve, reject) => {
            Papa.parse(CSV_URL, {
              download: true,
              header: true,
              dynamicTyping: true,
              skipEmptyLines: true,
              complete: (res) => {
                const rows = (res.data as any[]).map(r => ({
                  country: String(r.country),
                  sector: String(r.sector),
                  year: Number(r.year),
                  value: Number(r.value || 0),
                })) as Row[];
                setAll(rows);
                const cs = Array.from(new Set(rows.map(r => r.country))).sort();
                setCountries(cs);
                resolve();
              },
              error: (e) => reject(e),
            });
          });
        }
      } catch (e: any) {
        setErr(e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // If API is used, refetch series when country changes
  useEffect(() => {
    if (!API_BASE) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const from = 2018, to = 2023;
        const rows = await fetch(`${API_BASE}/agg?country=${encodeURIComponent(country)}&from=${from}&to=${to}`)
          .then(async r => {
            if (!r.ok) throw new Error(await r.text());
            return r.json();
          });
        const shaped = (rows as any[]).map(d => ({
          country,
          sector: String(d.sector),
          year: Number(d.year),
          value: Number(d.value),
        })) as Row[];
        setAll(shaped);
      } catch (e: any) {
        setErr(e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, [country]);

  // ---- prepare series for selected country/sector ----
  const series = useMemo(() => {
    if (!all.length) return { years: [] as number[], values: [] as number[] };
    const rows = all.filter(r => r.country === country);
    const byYear: Record<number, number> = {};
    for (const r of rows) {
      if (sector === "Total (all sectors)") {
        byYear[r.year] = (byYear[r.year] || 0) + r.value;
      } else if (r.sector === sector) {
        byYear[r.year] = (byYear[r.year] || 0) + r.value;
      }
    }
    const years = Object.keys(byYear).map(Number).sort((a,b)=>a-b);
    const values = years.map(y => byYear[y]);
    return { years, values };
  }, [all, country, sector]);

  // ---- run ML: forecast next 3 years + anomalies ----
  const h = 3;
  const { forecastRows, kpi, anomalies } = useMemo(() => {
    const years = series.years;
    const values = series.values;
    if (!years.length) return { forecastRows: [] as any[], kpi: null as any, anomalies: [] as any[] };

    // Fit
    const { forecasts } = holtLinear(values, h, 0.4, 0.3);
    const lastYear = years[years.length - 1];

    // Build chart rows (history + forecast markers)
    const rows: Array<{ year: number; actual?: number; forecast?: number }> = [];
    for (let i = 0; i < years.length; i++) rows.push({ year: years[i], actual: values[i] });
    for (let i = 1; i <= h; i++) rows.push({ year: lastYear + i, forecast: Math.max(0, forecasts[i - 1]) });

    // Simple KPIs
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const latest = values[values.length - 1];
    const next = forecasts[0];

    // anomalies
    const anoms = detectAnomalies(years, values);

    return {
      forecastRows: rows,
      kpi: { avg, latest, next },
      anomalies: anoms,
    };
  }, [series.years, series.values]);

  return (
    <section className="pg">
      {styles}

      <h1 className="hd">ML Analytics</h1>
      <p className="soft">
        Explore quick **forecasting** and **anomaly detection** built on the same dataset used in Analytics.
        Forecasts use Holt’s linear trend (double exponential smoothing) and show a short-term projection
        for the next three years. Anomalies flag unusually large year-over-year changes using a z-score rule.
      </p>

      <div className="grid2">
        {/* Controls */}
        <div className="panel">
          <div className="label">Country</div>
          <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
            {(countries.length ? countries : ["WORLD", "US", "China", "EU27 & UK"]).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="label" style={{ marginTop: 10 }}>Sector</div>
          <select
            className="input"
            value={sector}
            onChange={(e) => setSector(e.target.value as any)}
          >
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div className="kpi">
            <div className="tile">
              <div className="t">Latest</div>
              <div className="v">{kpi ? fmt(kpi.latest) : "—"}</div>
            </div>
            <div className="tile">
              <div className="t">Avg (history)</div>
              <div className="v">{kpi ? fmt(kpi.avg) : "—"}</div>
            </div>
            <div className="tile">
              <div className="t">Next-year forecast</div>
              <div className="v">{kpi ? fmt(kpi.next) : "—"}</div>
            </div>
          </div>

          {anomalies.length > 0 && (
            <div className="soft" style={{ marginTop: 10 }}>
              <strong>Anomalies:</strong>{" "}
              {anomalies.map(a => `${a.year} (z=${a.z.toFixed(2)})`).join(", ")}
            </div>
          )}
        </div>

        {/* Chart + table */}
        <div className="panel">
          <div style={{ height: 420, background: GP.soft, border: `1px solid ${GP.border}`, borderRadius: 10, padding: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastRows} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="actual" name="Actual" stroke={GP.green} dot />
                <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#0ea5e9" strokeDasharray="5 4" dot />
                {anomalies.map(a => (
                  <ReferenceDot
                    key={a.year}
                    x={a.year}
                    y={forecastRows.find(r => r.year === a.year)?.actual}
                    r={5}
                    fill="#ef4444"
                    stroke="#991b1b"
                    label={{ value: "Anomaly", position: "top", fill: "#991b1b", fontSize: 12 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="cap">
            Forecasts are illustrative (Holt linear). Units: <strong>GtCO₂</strong>. Anomalies flag unusual year-over-year changes (|z| ≥ 2).
          </div>

          {/* Forecast table */}
          <div className="soft" style={{ marginTop: 10 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width: 120 }}>Year</th>
                  <th>Actual</th>
                  <th>Forecast</th>
                </tr>
              </thead>
              <tbody>
                {forecastRows.map(r => (
                  <tr key={r.year}>
                    <td>{r.year}</td>
                    <td>{r.actual == null ? "—" : fmt(r.actual)}</td>
                    <td style={{ color: r.forecast == null ? undefined : "#0ea5e9" }}>
                      {r.forecast == null ? "—" : fmt(r.forecast)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

      {loading && <p style={{ marginTop: 10 }}>Loading…</p>}
      {err && <p style={{ marginTop: 10, color: "#8a1f11" }}>Error: {err}</p>}
    </section>
  );
}
