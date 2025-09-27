import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Label,
} from "recharts";

type AnyRow = Record<string, any>;
type WideRow = { year: number } & Record<string, number | null>;

const CSV_URL = "/data/dataset.csv";

// fallback, used if CSV fails or aggregates to nothing
const fallback: WideRow[] = [
  { year: 2018, Transport: 0.96, Power: 1.12 },
  { year: 2019, Transport: 1.02, Power: 1.15 },
  { year: 2020, Transport: 0.88, Power: 1.05 },
  { year: 2021, Transport: 1.10, Power: 1.18 },
  { year: 2022, Transport: 1.15, Power: 1.21 },
];

export default function Analytics() {
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 1) Load CSV once
  useEffect(() => {
    Papa.parse<AnyRow>(CSV_URL, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = (res.data || []).filter(Boolean) as AnyRow[];
        setRows(data);
        // small one-time summary for debugging
        try {
          const keys = new Set<string>();
          for (let i = 0; i < Math.min(3, data.length); i++) {
            Object.keys(data[i]).forEach((k) => keys.add(k));
          }
          // eslint-disable-next-line no-console
          console.log("[Analytics] sample keys:", Array.from(keys));
        } catch {}
        setLoading(false);
      },
      error: (e) => {
        setErr(e.message || "Failed to load CSV");
        setRows([]);
        setLoading(false);
      },
    });
  }, []);

  // 2) Transform to wide: pick top 2 sectors by total value
  const { wideData, sectorKeys } = useMemo(() => {
    if (!rows.length) return { wideData: [] as WideRow[], sectorKeys: [] as string[] };

    // Try to detect year
    const toYear = (r: AnyRow): number | null => {
      if (r.year != null) return Number(r.year);
      if (r.Year != null) return Number(r.Year);
      if (r.timestamp != null) return new Date(Number(r.timestamp) * 1000).getFullYear();
      if (r.Timestamp != null) return new Date(Number(r.Timestamp) * 1000).getFullYear();
      if (r.date) {
        const d = new Date(String(r.date));
        if (!isNaN(d.getTime())) return d.getFullYear();
      }
      if (r.Date) {
        const d = new Date(String(r.Date));
        if (!isNaN(d.getTime())) return d.getFullYear();
      }
      return null;
    };

    // Sector/name
    const sectorOf = (r: AnyRow): string | null => {
      const s = (r.sector ?? r.Sector ?? r.category ?? r.Category ?? "").toString().trim();
      return s ? s : null;
    };

    // Value
    const toValue = (r: AnyRow): number | null => {
      const v = r.value ?? r.Value ?? r.amount ?? r.Amount;
      if (v == null) return null;
      const n = typeof v === "string" ? Number(v.replace(/,/g, "")) : Number(v);
      return Number.isFinite(n) ? n : null;
    };

    // Compute totals by sector to select top 2
    const totals = new Map<string, number>();
    for (const r of rows) {
      const s = sectorOf(r);
      const v = toValue(r);
      if (!s || v == null) continue;
      totals.set(s, (totals.get(s) ?? 0) + v);
    }
    const sortedSectors = Array.from(totals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([s]) => s);

    const chosen = sortedSectors.slice(0, 2);
    // If not enough sectors detected, fall back to common names
    if (chosen.length < 2) {
      if (!chosen.includes("power")) chosen.push("power");
      if (!chosen.includes("transport")) chosen.push("transport");
    }
    const sectorKeys = chosen.slice(0, 2);

    // Pivot by year -> wide rows
    const byYear = new Map<number, WideRow>();
    for (const r of rows) {
      const y = toYear(r);
      if (y == null || !Number.isFinite(y)) continue;
      const s = sectorOf(r);
      const v = toValue(r);
      if (!s || v == null) continue;

      if (!byYear.has(y)) {
        const base: WideRow = { year: y };
        for (const k of sectorKeys) base[k] = null;
        byYear.set(y, base);
      }
      if (sectorKeys.includes(s)) {
        const obj = byYear.get(y)!;
        obj[s] = v;
      }
    }

    const wide = Array.from(byYear.values()).sort((a, b) => a.year - b.year);
    return { wideData: wide, sectorKeys };
  }, [rows]);

  const fmt = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="p-4">Loading…</div>;

  const dataToShow = wideData.length ? wideData : fallback;
  const lines = (sectorKeys.length ? sectorKeys : Object.keys(fallback[0]).filter(k => k !== "year"))
    .map((key, i) => ({
      key,
      stroke: i === 0 ? "#8884d8" : "#82ca9d",
    }));

  return (
    <section aria-labelledby="analytics-heading">
      <h1 id="analytics-heading" className="text-2xl font-semibold mb-2">Emissions Analytics</h1>
      <p className="text-gray-700 mb-4">
        Values shown in <strong>GtCO₂</strong>.
        {err ? <span className="text-red-600"> (Note: {err})</span> : null}
      </p>

      <div style={{ height: 360, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataToShow} margin={{ left: 12, right: 12, top: 8, bottom: 28 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tickMargin={8}>
              <Label value="Year" position="insideBottom" offset={-18} />
            </XAxis>
            <YAxis
              width={80}
              tickFormatter={(v: number) => fmt.format(Number(v))}
            >
              <Label
                value="Emissions (GtCO₂)"
                angle={-90}
                position="insideLeft"
                offset={10}
                style={{ textAnchor: "middle" }}
              />
            </YAxis>
            <Tooltip
              formatter={(value: any) => `${fmt.format(Number(value))} GtCO₂`}
              labelFormatter={(label: any) => `Year: ${label}`}
            />
            <Legend verticalAlign="bottom" height={36} />
            {lines.map(({ key, stroke }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={stroke}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
