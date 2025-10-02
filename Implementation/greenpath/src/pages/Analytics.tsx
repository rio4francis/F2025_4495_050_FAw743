// src/pages/Analytics.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

type Row = { country: string; sector: string; year: number; value: number };

const API_URL = import.meta.env.VITE_API_URL || "";      // when set, use Lambda/API
const CSV_URL = "/data/agg.csv";                          // fallback when API_URL not set

const SECTORS = [
  "Power",
  "Industry",
  "Ground transport",
  "Residential",
  "Domestic aviation",
  "International aviation",
] as const;

const COLORS: Record<(typeof SECTORS)[number], string> = {
  "Power": "#1f77b4",                // blue
  "Industry": "#ff7f0e",             // orange
  "Ground transport": "#2ca02c",     // green
  "Residential": "#9467bd",          // purple
  "Domestic aviation": "#d62728",    // red
  "International aviation": "#8c564b"// brown
};

export default function Analytics() {
  // ----- hooks (always at top)
  const [allRows, setAllRows] = useState<Row[]>([]);        // CSV: entire dataset; API: current country rows
  const [countries, setCountries] = useState<string[]>([]);
  const [country, setCountry] = useState<string>("WORLD");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);
  const didInit = useRef(false);

  // ----- one-time init
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    setLoading(true);
    setErr(null);

    if (API_URL) {
      // API mode: try to load countries list, then load initial country rows
      const load = async () => {
        try {
          // optional countries endpoint (ok if 404)
          try {
            const r = await fetch(`${API_URL}/countries`);
            if (r.ok) {
              const arr: string[] = await r.json();
              if (arr?.length) setCountries(arr);
            }
          } catch {/* ignore */}

          // initial dataset for default country
          const from = 2018, to = 2023;
          const res = await fetch(`${API_URL}/agg?country=${encodeURIComponent(country)}&from=${from}&to=${to}`);
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
      // CSV mode: load entire file once
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

  // ----- whenever country changes (API mode only), fetch new series
  useEffect(() => {
    if (!API_URL) return;                   // CSV mode doesn’t refetch; we filter locally
    if (!country) return;

    setLoading(true);
    setErr(null);

    const from = 2018, to = 2023;
    fetch(`${API_URL}/agg?country=${encodeURIComponent(country)}&from=${from}&to=${to}`)
      .then(r => r.json())
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

  // ----- derived: rows for the selected country (CSV filters locally; API already scoped)
  const rowsForCountry = useMemo(() => {
    return API_URL ? allRows : allRows.filter(r => r.country === country);
  }, [allRows, country]);

  const years = useMemo(() => {
    const set = new Set(rowsForCountry.map(r => r.year));
    return Array.from(set).sort((a, b) => a - b);
  }, [rowsForCountry]);

  // convert to wide format for recharts: [{year, Power, Industry, ...}]
  const wide = useMemo(() => {
    const byYear: Record<number, any> = {};
    for (const y of years) byYear[y] = { year: y };
    rowsForCountry.forEach(r => {
      if (!byYear[r.year]) byYear[r.year] = { year: r.year };
      (byYear[r.year] as any)[r.sector] = r.value;
    });
    return years.map(y => byYear[y]);
  }, [rowsForCountry, years]);

  // ----- ui
  return (
    <section aria-labelledby="analytics-heading">
      <h1 id="analytics-heading" className="text-2xl font-semibold mb-2">Emissions Analytics</h1>
      <p className="text-gray-700 mb-4">Values shown in <strong>GtCO₂</strong>.</p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-sm">
          Country:&nbsp;
          <select
            className="border rounded px-2 py-1"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {(countries.length ? countries : ["WORLD", "US", "China", "EU27 & UK"]).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <div className="text-sm flex items-center gap-2">
          <button
            type="button"
            className={`px-3 py-1 rounded border ${chartType === "line" ? "bg-gray-200" : ""}`}
            onClick={() => setChartType("line")}
          >
            Line
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded border ${chartType === "bar" ? "bg-gray-200" : ""}`}
            onClick={() => setChartType("bar")}
          >
            Bar
          </button>
        </div>
      </div>

      {loading && <p>Loading…</p>}
      {err && <p className="text-red-600">Error: {err}</p>}

      {!loading && !err && (
        <div style={{ height: 360, width: "100%" }}>
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
        </div>
      )}
    </section>
  );
}
