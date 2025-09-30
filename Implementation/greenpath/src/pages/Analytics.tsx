import { useEffect, useMemo, useRef, useState } from "react";
import * as Papa from "papaparse";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Label
} from "recharts";

type AnyRow = Record<string, any>;
type Row = { country: string; sector: string; year: number; value: number };
type WideRow = { year: number } & Record<string, number | null>;

// CSV must be in /public/data
const CSV_URL = "/data/agg.csv";

// Fixed sector order (your 6 sectors)
const SECTORS = [
  "Power",
  "Industry",
  "Ground transport",
  "Residential",
  "Domestic aviation",
  "International aviation",
];

// Distinct, color-blind–safe colors
const SECTOR_COLORS: Record<string, string> = {
  "Power":                 "#0072B2", // blue
  "Industry":              "#D55E00", // vermilion
  "Ground transport":      "#009E73", // green
  "Residential":           "#CC79A7", // purple
  "Domestic aviation":     "#E69F00", // orange
  "International aviation":"#8C564B", // brown
};

export default function Analytics() {
  const [rows, setRows] = useState<Row[]>([]);
  const [country, setCountry] = useState<string>("");
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const didRun = useRef(false);

  // Load aggregated CSV
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    Papa.parse<AnyRow>(CSV_URL, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data: Row[] = (res.data as AnyRow[])
          .map((r) => ({
            country: String(r.country ?? r.Country ?? "").trim(),
            sector: String(r.sector ?? r.Sector ?? "").trim(),
            year: Number(r.year ?? r.Year),
            value: Number(
              typeof r.value === "string" ? r.value.replace(/,/g, "") : r.value ?? r.Value
            ),
          }))
          .filter(
            (r) =>
              r.country &&
              SECTORS.includes(r.sector) &&
              Number.isFinite(r.year) &&
              Number.isFinite(r.value)
          );
        setRows(data);
        setLoading(false);
      },
      error: (e: any) => {
        setErr(e.message || "Failed to load agg.csv");
        setRows([]);
        setLoading(false);
      },
    });
  }, []);

  // Country list (WORLD, US, EU27 & UK first if present)
  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.country);
    const list = Array.from(set).sort();
    const preferred = ["WORLD", "US", "EU27 & UK", "China", "India"];
    return [
      ...preferred.filter((p) => list.includes(p)),
      ...list.filter((c) => !preferred.includes(c)),
    ];
  }, [rows]);

  // Default country
  useEffect(() => {
    if (!country && countries.length) setCountry(countries[0]);
  }, [countries, country]);

  // Build wide format for chart: {year, Power, Industry, ...}
  const { dataWide, sectorKeys } = useMemo(() => {
    if (!country) return { dataWide: [] as WideRow[], sectorKeys: [] as string[] };
    const slice = rows.filter((r) => r.country === country);

    const byYear = new Map<number, WideRow>();
    for (const r of slice) {
      if (!byYear.has(r.year)) byYear.set(r.year, { year: r.year });
      (byYear.get(r.year) as WideRow)[r.sector] = r.value;
    }

    const years = Array.from(byYear.keys()).sort((a, b) => a - b);
    const data = years.map((y) => {
      const row = byYear.get(y)!;
      for (const s of SECTORS) if (!(s in row)) row[s] = null;
      return row;
    });

    return { dataWide: data, sectorKeys: SECTORS.filter((s) => slice.some((r) => r.sector === s)) };
  }, [rows, country]);

  const fmt = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <section aria-labelledby="analytics-heading">
      <h1 id="analytics-heading" className="text-2xl font-semibold mb-2">Emissions Analytics</h1>
      <p className="text-gray-700 mb-4">
        Select a country and chart type to view sector trends (GtCO₂).
        {err ? <span className="text-red-600"> (Note: {err})</span> : null}
      </p>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-3">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Country:</span>
          <select
            className="border rounded px-2 py-1"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Chart:</span>
          <div className="inline-flex rounded border overflow-hidden">
            <button
              type="button"
              className={`px-3 py-1 text-sm ${chartType === "line" ? "bg-gray-100 font-medium" : ""}`}
              onClick={() => setChartType("line")}
            >
              Line
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-sm border-l ${chartType === "bar" ? "bg-gray-100 font-medium" : ""}`}
              onClick={() => setChartType("bar")}
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 420, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart data={dataWide} margin={{ left: 12, right: 12, top: 8, bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tickMargin={8}>
                <Label value="Year" position="insideBottom" offset={-18} />
              </XAxis>
              <YAxis width={84} tickFormatter={(v: number) => fmt.format(Number(v))}>
                <Label value="Emissions (GtCO₂)" angle={-90} position="insideLeft" offset={10} style={{ textAnchor: "middle" }} />
              </YAxis>
              <Tooltip formatter={(v: any, n: any) => [`${fmt.format(Number(v))} GtCO₂`, n]} labelFormatter={(l: any) => `Year: ${l}`} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: 8 }} />
              {SECTORS.map((s) => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={SECTOR_COLORS[s]}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                  connectNulls
                  hide={!sectorKeys.includes(s)}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={dataWide} margin={{ left: 12, right: 12, top: 8, bottom: 28 }} barCategoryGap="18%">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" tickMargin={8}>
                <Label value="Year" position="insideBottom" offset={-18} />
              </XAxis>
              <YAxis width={84} tickFormatter={(v: number) => fmt.format(Number(v))}>
                <Label value="Emissions (GtCO₂)" angle={-90} position="insideLeft" offset={10} style={{ textAnchor: "middle" }} />
              </YAxis>
              <Tooltip formatter={(v: any, n: any) => [`${fmt.format(Number(v))} GtCO₂`, n]} labelFormatter={(l: any) => `Year: ${l}`} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: 8 }} />
              {SECTORS.map((s) => (
                <Bar
                  key={s}
                  dataKey={s}
                  fill={SECTOR_COLORS[s]}
                  hide={!sectorKeys.includes(s)}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}
