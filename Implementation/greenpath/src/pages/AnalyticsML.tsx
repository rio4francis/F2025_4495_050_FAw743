// src/pages/AnalyticsML.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import type { ParseResult } from "papaparse";
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
  ScatterChart,
  Scatter,
  ZAxis,
  BarChart,
  Bar,
  Cell,
} from "recharts";

/* ===================== Types & Config ===================== */

type Row = { country: string; sector: string; year: number; value: number };

type ForecastRow = Record<string, number | null> & { year: number };
type Kpi = { latest: number; next: number } | null;

type Anomaly = { year: number; value: number; z: number };
type AnomaliesBySector = Record<string, Anomaly[]>;

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

const GP = {
  green: "#127c4c",
  blue: "#0ea5e9",
  red: "#ef4444",
  ink: "#223c2f",
  soft: "#f6fbf8",
  border: "#e4efe8",
} as const;

const CLUSTER_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const fmt = (n: number, digits = 2) =>
  n.toLocaleString(undefined, { maximumFractionDigits: digits });

/* ===================== Forecast & Anomaly helpers ===================== */

function holtLinear(series: number[], h: number, alpha = 0.4, beta = 0.3) {
  if (series.length < 2) {
    const last = series[series.length - 1] ?? 0;
    return { forecasts: Array(h).fill(last), level: last, trend: 0 };
  }
  let l = series[0];
  let b = series[1] - series[0];

  for (let t = 1; t < series.length; t++) {
    const y = series[t];
    const lPrev = l;
    l = alpha * y + (1 - alpha) * (l + b);
    b = beta * (l - lPrev) + (1 - beta) * b;
  }

  const forecasts = Array.from({ length: h }, (_, i) => l + (i + 1) * b);
  return { forecasts, level: l, trend: b };
}

function detectAnomalies(years: number[], values: number[]): Anomaly[] {
  if (years.length < 4) return [];
  const deltas: number[] = [];
  for (let i = 1; i < values.length; i++) deltas.push(values[i] - values[i - 1]);
  const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const sd =
    Math.sqrt(deltas.reduce((a, d) => a + (d - mean) ** 2, 0) / Math.max(1, deltas.length - 1)) || 0;
  const z = (d: number) => (sd === 0 ? 0 : (d - mean) / sd);

  const out: Anomaly[] = [];
  for (let i = 1; i < years.length; i++) {
    const dz = z(values[i] - values[i - 1]);
    if (Math.abs(dz) >= 2) out.push({ year: years[i], value: values[i], z: dz });
  }
  return out;
}

/* ===================== Tiny K-means (6D sector shares) ===================== */

type Vec = number[];
type KMResult = { labels: number[]; centroids: Vec[] };

const euclid2 = (a: Vec, b: Vec) => a.reduce((s, ai, i) => s + (ai - b[i]) ** 2, 0);
const meanVec = (arr: Vec[]) => {
  const out = Array(arr[0].length).fill(0);
  for (const v of arr) for (let i = 0; i < v.length; i++) out[i] += v[i];
  for (let i = 0; i < out.length; i++) out[i] /= arr.length;
  return out;
};

function kmeans(X: Vec[], k: number, maxIter = 100): KMResult {
  if (X.length === 0) return { labels: [], centroids: [] };
  const centroids: Vec[] = [];
  const step = Math.max(1, Math.floor(X.length / k));
  for (let i = 0; i < k; i++) centroids.push([...X[Math.min(i * step, X.length - 1)]]);

  const labels = new Array(X.length).fill(0);
  for (let it = 0; it < maxIter; it++) {
    let changed = false;

    for (let i = 0; i < X.length; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = euclid2(X[i], centroids[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      if (labels[i] !== best) {
        labels[i] = best;
        changed = true;
      }
    }

    const groups: Vec[][] = Array.from({ length: k }, () => []);
    for (let i = 0; i < X.length; i++) groups[labels[i]].push(X[i]);

    let moved = false;
    for (let c = 0; c < k; c++) {
      if (groups[c].length === 0) continue;
      const newC = meanVec(groups[c]);
      if (euclid2(newC, centroids[c]) > 1e-10) moved = true;
      centroids[c] = newC;
    }

    if (!changed && !moved) break;
  }
  return { labels, centroids };
}

/* ===================== Component ===================== */

export default function AnalyticsML() {
  const styles = (
    <style>{`
      :root{ --heading: clamp(24px,3.2vw,36px); --body: clamp(15px,1.9vw,16px); }
      .pg{ font-size:var(--body); color:${GP.ink}; line-height:1.6; }
      .hd{ font-size:var(--heading); font-weight:900; color:${GP.green}; margin:0 0 6px; }
      .lead{ margin:0 0 10px; color:#355348; }
      .panel{ background:#fff; border:1px solid ${GP.border}; border-radius:16px; padding:14px; box-shadow:0 10px 26px rgba(0,0,0,.06); }
      .soft{ background:${GP.soft}; border:1px solid ${GP.border}; border-radius:14px; padding:10px; }
      .grid2{ display:grid; grid-template-columns:320px 1fr; gap:14px; }
      @media (max-width:980px){ .grid2{ grid-template-columns:1fr; } }
      .label{ font-weight:900; color:${GP.green}; margin-bottom:6px; }
      .input{ width:100%; border:1px solid ${GP.border}; border-radius:10px; padding:8px 10px; }
      .kpi{ display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-top:10px; }
      .tile{ background:#fff; border:1px solid ${GP.border}; border-radius:12px; padding:10px; text-align:center; }
      .tile .t{ font-size:13px; opacity:.8; } .tile .v{ font-size:18px; font-weight:900; color:${GP.green}; }
      .cap{ margin-top:8px; font-size:13px; color:#4b6256; }
      .tabs{ display:flex; gap:8px; margin:8px 0 10px; flex-wrap:wrap; }
      .tab{ padding:8px 12px; border:1px solid ${GP.border}; border-radius:10px; background:#fff; cursor:pointer; font-weight:800; }
      .tab.active{ border-color:#bfe3cf; background:#eef8f1; }
      table{ width:100%; border-collapse:collapse; }
      th,td{ padding:8px 10px; border-top:1px solid ${GP.border}; }
      thead th{ background:#eef8f1; color:#0e5f3a; font-weight:800; }
      .wideTable{ overflow-x:auto; border:1px solid ${GP.border}; border-radius:14px; background:#fff; }
      .widePanel{ padding:0; }
      .sectionPad{ padding:14px; }
      .tabLead{ margin:0 0 12px; color:#355348; }
    `}</style>
  );

  const [all, setAll] = useState<Row[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [country, setCountry] = useState<string>("WORLD");
  const did = useRef(false);

  const [tab, setTab] = useState<"forecast" | "prediction" | "anomaly" | "cluster">("forecast");
  const [kClusters, setKClusters] = useState(3);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* ---------------- Data load ---------------- */

  useEffect(() => {
    if (did.current) return;
    did.current = true;

    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        if (API_BASE) {
          const from = 2018;
          const to = 2023;

          const listRes = await fetch(`${API_BASE}/countries`);
          if (listRes.ok) {
            const list = (await listRes.json()) as unknown;
            if (Array.isArray(list)) setCountries(list as string[]);
          }

          const rowsRes = await fetch(
            `${API_BASE}/agg?country=${encodeURIComponent(country)}&from=${from}&to=${to}`
          );
          if (!rowsRes.ok) throw new Error(await rowsRes.text());
          const rowsJson = (await rowsRes.json()) as Array<{ year: number; sector: string; value: number }>;
          const shaped: Row[] = rowsJson.map((d) => ({
            country,
            sector: String(d.sector),
            year: Number(d.year),
            value: Number(d.value),
          }));
          setAll(shaped);
        } else {
          await new Promise<void>((resolve, reject) => {
            Papa.parse(CSV_URL, {
              download: true,
              header: true,
              dynamicTyping: true,
              skipEmptyLines: true,
              complete: (res: ParseResult<any>) => {
                const rows: Row[] = (res.data as any[]).map((r) => ({
                  country: String(r.country),
                  sector: String(r.sector),
                  year: Number(r.year),
                  value: Number(r.value || 0),
                }));
                setAll(rows);
                setCountries(Array.from(new Set(rows.map((r) => r.country))).sort());
                resolve();
              },
              error: (e) => reject(e),
            });
          });
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!API_BASE) return;

    const run = async () => {
      setLoading(true);
      setErr(null);
      try {
        const from = 2018;
        const to = 2023;
        const rowsRes = await fetch(
          `${API_BASE}/agg?country=${encodeURIComponent(country)}&from=${from}&to=${to}`
        );
        if (!rowsRes.ok) throw new Error(await rowsRes.text());
        const rowsJson = (await rowsRes.json()) as Array<{ year: number; sector: string; value: number }>;
        const shaped: Row[] = rowsJson.map((d) => ({
          country,
          sector: String(d.sector),
          year: Number(d.year),
          value: Number(d.value),
        }));
        setAll(shaped);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [country]);

  /* ---------------- Shared: years ---------------- */

  const yearsAll = useMemo(() => {
    const ys = new Set<number>();
    all.forEach((r) => {
      if (r.country === country) ys.add(r.year);
    });
    return Array.from(ys).sort((a, b) => a - b);
  }, [all, country]);

  /* ---------------- Forecast tab (lines) ---------------- */

  const forecastRows: ForecastRow[] = useMemo(() => {
    if (!yearsAll.length) return [];

    const h = 3;
    const last = yearsAll[yearsAll.length - 1];
    const allYears = [...yearsAll, last + 1, last + 2, last + 3];

    const sectorSeries: Record<string, number[]> = {};
    for (const s of SECTORS) {
      const values: number[] = [];
      for (const y of yearsAll) {
        const sum = all
          .filter((r) => r.country === country && r.sector === s && r.year === y)
          .reduce((a, b) => a + b.value, 0);
        values.push(sum);
      }
      sectorSeries[s] = values;
    }

    const forecasts: Record<string, number[]> = {};
    for (const s of SECTORS) {
      const { forecasts: fs } = holtLinear(sectorSeries[s], h, 0.4, 0.3);
      forecasts[s] = fs.map((v) => Math.max(0, v));
    }

    const rows: ForecastRow[] = allYears.map((year) => {
      const row: ForecastRow = { year };
      for (const s of SECTORS) {
        const idx = yearsAll.indexOf(year);
        if (idx >= 0) {
          row[s] = sectorSeries[s][idx] ?? null;     // actual
          row[`${s}_f`] = null;
        } else {
          const fIndex = year - last - 1;            // forecast
          row[s] = null;
          row[`${s}_f`] = forecasts[s][fIndex] ?? null;
        }
      }
      return row;
    });

    return rows;
  }, [all, country, yearsAll]);

  const kpi: Kpi = useMemo(() => {
    if (!yearsAll.length) return null;
    const totals = yearsAll.map((y) =>
      SECTORS.reduce((sum, s) => {
        const v = all
          .filter((r) => r.country === country && r.sector === s && r.year === y)
          .reduce((a, b) => a + b.value, 0);
        return sum + v;
      }, 0)
    );
    const { forecasts } = holtLinear(totals, 1, 0.4, 0.3);
    const latest = totals[totals.length - 1];
    const next = forecasts[0] ?? latest;
    return { latest, next };
  }, [all, country, yearsAll]);

  /* ---------------- Prediction tab (SIDE-BY-SIDE bars per sector) ---------------- */

  type CompareRow = { sector: string; actual: number; predicted: number; color: string };

  const predCompareRows: CompareRow[] = useMemo(() => {
    if (!yearsAll.length) return [];
    const last = yearsAll[yearsAll.length - 1];
    const prev = yearsAll.length >= 2 ? yearsAll[yearsAll.length - 2] : last;

    // Totals per sector for last & prev year
    const totals = (y: number) =>
      SECTORS.reduce<Record<string, number>>((acc, s) => {
        acc[s] = all
          .filter((r) => r.country === country && r.sector === s && r.year === y)
          .reduce((a, b) => a + b.value, 0);
        return acc;
      }, {});

    const lastTotals = totals(last);
    const prevTotals = totals(prev);

    const totPrev = SECTORS.reduce((sum, s) => sum + (prevTotals[s] || 0), 0) || 1;
    const totLast = SECTORS.reduce((sum, s) => sum + (lastTotals[s] || 0), 0) || 1;

    // Drift shares -> normalize -> scale by next total
    const seriesTotals = yearsAll.map((y) =>
      SECTORS.reduce((sum, s) => {
        return sum + all
          .filter((r) => r.country === country && r.sector === s && r.year === y)
          .reduce((a, b) => a + b.value, 0);
      }, 0)
    );
    const { forecasts } = holtLinear(seriesTotals, 1, 0.4, 0.3);
    const totalNextAbs = forecasts[0] ?? seriesTotals[seriesTotals.length - 1];

    const driftShares: Record<string, number> = {};
    let sumShares = 0;
    for (const s of SECTORS) {
      const sharePrev = (prevTotals[s] || 0) / totPrev;
      const shareLast = (lastTotals[s] || 0) / totLast;
      let nextShare = shareLast + (shareLast - sharePrev); // simple drift
      nextShare = Math.max(0, Math.min(1, nextShare));
      driftShares[s] = nextShare;
      sumShares += nextShare;
    }

    const rows: CompareRow[] = SECTORS.map((s) => {
      const normShare = sumShares > 0 ? driftShares[s] / sumShares : 0;
      return {
        sector: s,
        actual: lastTotals[s] || 0,
        predicted: normShare * totalNextAbs,
        color: COLORS[s],
      };
    });

    return rows;
  }, [all, country, yearsAll]);

  /* ---------------- Anomalies (ALL sectors) ---------------- */

  const anomalyRowsAllSectors = useMemo(() => {
    if (!yearsAll.length) return [];
    return yearsAll.map((y) => {
      const row: Record<string, number | string> = { year: y };
      for (const s of SECTORS) {
        const sum = all
          .filter((r) => r.country === country && r.sector === s && r.year === y)
          .reduce((a, b) => a + b.value, 0);
        row[s] = sum;
      }
      return row as { year: number } & Record<(typeof SECTORS)[number], number>;
    });
  }, [all, country, yearsAll]);

  const anomaliesBySector: AnomaliesBySector = useMemo(() => {
    const out: AnomaliesBySector = {};
    if (!anomalyRowsAllSectors.length) return out;

    for (const s of SECTORS) {
      const years = anomalyRowsAllSectors.map((r) => r.year);
      const values = anomalyRowsAllSectors.map((r) => Number(r[s]));
      out[s] = detectAnomalies(years, values);
    }
    return out;
  }, [anomalyRowsAllSectors]);

  /* ---------------- Clustering ---------------- */

  type CountryAgg = { years: Set<number>; totals: Record<string, number> };
  type ClusterPoint = {
    country: string;
    power: number;
    industry: number;
    transport: number;
    residential: number;
    domAv: number;
    intlAv: number;
    total: number;
  };

  const clusterData = useMemo(() => {
    if (!all.length) return { points: [] as ClusterPoint[], labels: [] as number[], centroids: [] as number[][] };

    const acc: Record<string, CountryAgg> = {};
    for (const r of all) {
      const c = (acc[r.country] ??= { years: new Set<number>(), totals: {} });
      c.totals[r.sector] = (c.totals[r.sector] || 0) + r.value;
      c.years.add(r.year);
    }

    const points: ClusterPoint[] = [];
    const X: number[][] = [];

    Object.entries(acc).forEach(([countryName, obj]) => {
      const yrs = Math.max(1, obj.years.size);
      const power = (obj.totals["Power"] || 0) / yrs;
      const industry = (obj.totals["Industry"] || 0) / yrs;
      const transport = (obj.totals["Ground transport"] || 0) / yrs;
      const residential = (obj.totals["Residential"] || 0) / yrs;
      const domAv = (obj.totals["Domestic aviation"] || 0) / yrs;
      const intlAv = (obj.totals["International aviation"] || 0) / yrs;

      const tot = power + industry + transport + residential + domAv + intlAv;
      if (tot <= 0) return;

      const p = power / tot,
        i = industry / tot,
        t = transport / tot,
        r = residential / tot,
        d = domAv / tot,
        ia = intlAv / tot;

      points.push({
        country: countryName,
        power: p,
        industry: i,
        transport: t,
        residential: r,
        domAv: d,
        intlAv: ia,
        total: tot,
      });

      X.push([p, i, t, r, d, ia]);
    });

    const kk = Math.min(Math.max(2, kClusters), Math.min(6, Math.max(2, X.length)));
    const { labels, centroids } = X.length ? kmeans(X, kk) : { labels: [] as number[], centroids: [] as number[][] };
    return { points, labels, centroids };
  }, [all, kClusters]);

  const centroidRows = useMemo(
    () =>
      clusterData.centroids.map((c, idx) => ({
        cluster: idx + 1,
        Power: (c[0] * 100).toFixed(1) + "%",
        Industry: (c[1] * 100).toFixed(1) + "%",
        "Ground transport": (c[2] * 100).toFixed(1) + "%",
        Residential: (c[3] * 100).toFixed(1) + "%",
        "Domestic aviation": (c[4] * 100).toFixed(1) + "%",
        "International aviation": (c[5] * 100).toFixed(1) + "%",
      })),
    [clusterData.centroids]
  );

  /* ---------------- Descriptions ---------------- */

  const pageLead =
    "This page adds light-weight machine-learning on the same dataset (2018–2023, GtCO₂). Use it to forecast totals, predict next-year sector shares, flag unusual year-over-year changes, and group countries by similar sector mixes.";

  const tabLead: Record<typeof tab, string> = {
    forecast:
      "Forecast uses Holt’s linear trend on each sector per country. Solid lines are historical values; dashed segments are 3-year projections.",
    prediction:
      "Prediction compares each sector’s latest actual total (2023) against a 2024 value predicted by drifting recent shares (normalized) and scaling by a Holt forecast of the total.",
    anomaly:
      "Anomalies highlight years where a sector’s year-over-year change is unusual (|z| ≥ 2) relative to its recent pattern.",
    cluster:
      "Clustering groups countries by average sector composition (shares sum to 100%). We show Power% vs Ground-transport% with bubble size ~ total emissions.",
  };

  /* ---------------- Handlers ---------------- */

  const onCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => setCountry(e.target.value);

  /* ===================== Render ===================== */

  return (
    <section className="pg">
      {styles}

      <h1 className="hd">ML Analytics</h1>
      <p className="lead">{pageLead}</p>

      <div className="tabs">
        <button className={`tab ${tab === "forecast" ? "active" : ""}`} onClick={() => setTab("forecast")}>
          Forecast
        </button>
        <button className={`tab ${tab === "prediction" ? "active" : ""}`} onClick={() => setTab("prediction")}>
          Prediction
        </button>
        <button className={`tab ${tab === "anomaly" ? "active" : ""}`} onClick={() => setTab("anomaly")}>
          Anomalies
        </button>
        <button className={`tab ${tab === "cluster" ? "active" : ""}`} onClick={() => setTab("cluster")}>
          Clustering
        </button>
      </div>
      <p className="tabLead">{tabLead[tab]}</p>

      {/* ===================== Forecast ===================== */}
      {tab === "forecast" && (
        <div className="grid2">
          <div className="panel">
            <div className="label">Country</div>
            <select className="input" value={country} onChange={onCountryChange}>
              {(countries.length ? countries : ["WORLD", "US", "China", "EU27 & UK"]).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="kpi">
              <div className="tile">
                <div className="t">Latest (total)</div>
                <div className="v">{kpi ? fmt(kpi.latest) : "—"}</div>
              </div>
              <div className="tile">
                <div className="t">Next-year (total)</div>
                <div className="v">{kpi ? fmt(kpi.next) : "—"}</div>
              </div>
            </div>

            <div className="soft" style={{ marginTop: 10 }}>
              Solid lines show actuals (2018–2023); dashed extensions are 3-year forecasts per sector. Units:
              <strong> GtCO₂</strong>.
            </div>
          </div>

          <div className="panel">
            <div
              style={{
                height: 460,
                background: GP.soft,
                border: `1px solid ${GP.border}`,
                borderRadius: 10,
                padding: 8,
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastRows} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {SECTORS.map((s) => (
                    <Line key={`${s}-a`} type="monotone" dataKey={s} name={s} stroke={COLORS[s]} dot />
                  ))}
                  {SECTORS.map((s) => (
                    <Line
                      key={`${s}-f`}
                      type="monotone"
                      dataKey={`${s}_f`}
                      stroke={COLORS[s]}
                      strokeDasharray="5 4"
                      dot={false}
                      legendType="none"
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="cap">
              <strong>Figure – Forecast by sector:</strong> historical emissions (solid) and 3-year projections
              (dashed) for all sectors in {country}.
            </p>
          </div>
        </div>
      )}

      {/* ===================== Prediction: side-by-side per sector ===================== */}
      {tab === "prediction" && (
        <div className="grid2">
          <div className="panel">
            <div className="label">Country</div>
            <select className="input" value={country} onChange={onCountryChange}>
              {(countries.length ? countries : ["WORLD", "US", "China", "EU27 & UK"]).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="soft" style={{ marginTop: 10 }}>
              Bars are grouped by <strong>sector</strong>. For each sector, the{" "}
              <span style={{ fontWeight: 700 }}>left bar</span> is <em>2023 actual</em> and the{" "}
              <span style={{ fontWeight: 700 }}>right bar</span> is the <em>2024 prediction</em> (share drift × Holt
              total). Sector color stays consistent; predicted bars are lighter with a dashed outline. Units:
              <strong> GtCO₂</strong>.
            </div>
          </div>

          <div className="panel">
            <div
              style={{
                height: 420,
                background: GP.soft,
                border: `1px solid ${GP.border}`,
                borderRadius: 10,
                padding: 8,
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={predCompareRows}
                  margin={{ left: 12, right: 12, top: 8, bottom: 8 }}
                  barCategoryGap={18}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sector" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => [fmt(v), "GtCO₂"]} />
                  <Legend />
                  <Bar dataKey="actual" name="2023 actual">
                    {predCompareRows.map((r, i) => (
                      <Cell key={`a-${i}`} fill={r.color} stroke={r.color} />
                    ))}
                  </Bar>
                  <Bar dataKey="predicted" name="2024 predicted">
                    {predCompareRows.map((r, i) => (
                      <Cell
                        key={`p-${i}`}
                        fill={r.color}
                        fillOpacity={0.35}
                        stroke={r.color}
                        strokeDasharray="4 3"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="cap">
              <strong>Figure – Per-sector change:</strong> compare actual (2023) vs predicted (2024) totals for each
              sector in {country}.
            </p>
          </div>
        </div>
      )}

      {/* ===================== Anomalies (ALL sectors) ===================== */}
      {tab === "anomaly" && (
        <div className="grid2">
          <div className="panel">
            <div className="label">Country</div>
            <select className="input" value={country} onChange={onCountryChange}>
              {(countries.length ? countries : ["WORLD", "US", "China", "EU27 & UK"]).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="soft" style={{ marginTop: 10 }}>
              We plot <strong>all sectors</strong> for {country}. Red dots flag years with unusual year-over-year
              changes (|z| ≥ 2). Units: <strong>GtCO₂</strong>.
            </div>
          </div>

          <div className="panel">
            <div
              style={{
                height: 420,
                background: GP.soft,
                border: `1px solid ${GP.border}`,
                borderRadius: 10,
                padding: 8,
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={anomalyRowsAllSectors} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {SECTORS.map((s) => (
                    <Line key={`anom-${s}`} type="monotone" dataKey={s} name={s} stroke={COLORS[s]} dot />
                  ))}
                  {SECTORS.map((s) =>
                    (anomaliesBySector[s] || []).map((a) => {
                      const yVal =
                        anomalyRowsAllSectors.find((r) => r.year === a.year)?.[s] ?? undefined;
                      if (yVal == null) return null;
                      return (
                        <ReferenceDot
                          key={`${s}-${a.year}`}
                          x={a.year}
                          y={Number(yVal)}
                          r={5}
                          fill={GP.red}
                          stroke="#991b1b"
                          label={{
                            value: `${s} anomaly`,
                            position: "top",
                            fill: "#991b1b",
                            fontSize: 11,
                          }}
                        />
                      );
                    })
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="cap">
              <strong>Figure – Multi-sector anomalies:</strong> red markers highlight statistically unusual jumps or
              drops for the sector-specific series in {country}.
            </p>
          </div>
        </div>
      )}

      {/* ===================== Clustering ===================== */}
      {tab === "cluster" && (
        <>
          <p className="soft">
            Countries are grouped by their <strong>average sectoral composition</strong> (2018–2023). We compute sector
            shares per country (sum to 100%), run k-means, and visualize <em>Power%</em> vs <em>Ground-transport%</em>.
            Bubble size hints at total emissions. <strong>Colors distinguish clusters.</strong>
          </p>

          <div className="panel sectionPad" style={{ marginBottom: 12 }}>
            <div className="label">Number of clusters (k)</div>
            <select
              className="input"
              value={String(kClusters)}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setKClusters(Number(e.target.value))}
            >
              {[2, 3, 4, 5, 6].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="panel">
            <div
              style={{
                height: 460,
                background: GP.soft,
                border: `1px solid ${GP.border}`,
                borderRadius: 10,
                padding: 8,
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" name="Power share" unit="%" />
                  <YAxis type="number" dataKey="y" name="Transport share" unit="%" />
                  <ZAxis type="number" dataKey="size" range={[40, 160]} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "x") return [`${value}%`, "Power share"];
                      if (name === "y") return [`${value}%`, "Transport share"];
                      if (name === "size") return [value, "Relative total"];
                      return [value, name];
                    }}
                    labelFormatter={() => ""}
                  />
                  <Legend />
                  {Object.entries(
                    clusterData.points.reduce(
                      (acc: Record<number, any[]>, pt, i) => {
                        const lab = clusterData.labels[i] ?? 0;
                        (acc[lab] ??= []).push({
                          x: Number((pt.power * 100).toFixed(2)),
                          y: Number((pt.transport * 100).toFixed(2)),
                          size: Math.max(30, Math.min(120, pt.total * 2)),
                          country: pt.country,
                        });
                        return acc;
                      },
                      {} as Record<number, any[]>
                    )
                  ).map(([cid, pts], idx) => (
                    <Scatter
                      key={cid}
                      data={pts as any}
                      name={`Cluster ${Number(cid) + 1}`}
                      fill={CLUSTER_COLORS[idx % CLUSTER_COLORS.length]}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="cap">
              <strong>Figure – Cluster map:</strong> each point is a country positioned by sector shares; color shows
              cluster, bubble size reflects relative totals.
            </p>
          </div>

          <div className="panel widePanel" style={{ marginTop: 12 }}>
            <div className="sectionPad">
              <div className="wideTable">
                <table style={{ minWidth: 880 }}>
                  <thead>
                    <tr>
                      <th>Cluster</th>
                      <th>Power</th>
                      <th>Industry</th>
                      <th>Ground transport</th>
                      <th>Residential</th>
                      <th>Domestic Av.</th>
                      <th>Intl. Av.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centroidRows.map((r) => (
                      <tr key={r.cluster}>
                        <td>#{r.cluster}</td>
                        <td>{r.Power}</td>
                        <td>{r.Industry}</td>
                        <td>{r["Ground transport"]}</td>
                        <td>{r.Residential}</td>
                        <td>{r["Domestic aviation"]}</td>
                        <td>{r["International aviation"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="panel widePanel" style={{ marginTop: 12 }}>
            <div className="sectionPad">
              <strong>Members by cluster</strong>
              <div style={{ marginTop: 8 }}>
                {(() => {
                  const byCluster: Record<number, string[]> = {};
                  clusterData.points.forEach((pt, i) => {
                    const lab = clusterData.labels[i] ?? 0;
                    (byCluster[lab] ??= []).push(pt.country);
                  });
                  return Object.entries(byCluster)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([c, list]) => (
                      <div key={c} style={{ marginBottom: 8 }}>
                        <span style={{ fontWeight: 900, color: GP.green }}>Cluster {Number(c) + 1}:</span>{" "}
                        {list.sort().join(", ")}
                      </div>
                    ));
                })()}
              </div>
            </div>
          </div>
        </>
      )}

      {loading && <p style={{ marginTop: 10 }}>Loading…</p>}
      {err && <p style={{ marginTop: 10, color: "#8a1f11" }}>Error: {err}</p>}
    </section>
  );
}
