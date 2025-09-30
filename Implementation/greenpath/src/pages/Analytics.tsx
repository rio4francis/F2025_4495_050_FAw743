import { useEffect, useMemo, useRef, useState } from "react";
import * as Papa from "papaparse";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Label,
} from "recharts";

type AnyRow = Record<string, any>;
type WideRow = { year: number } & Record<string, number | null>;
const CSV_URL = "/data/dataset.csv";

const palette = [
  "#8884d8","#82ca9d","#ff7300","#00C49F","#FF8042","#0088FE",
  "#A28FD0","#FFBB28","#00B8D9","#FF5A76","#7CB342","#AB47BC",
  "#26C6DA","#FF7043"
];

// country -> sector -> year -> value
type Agg = Map<string, Map<string, Map<number, number>>>;

export default function Analytics() {
  const [agg, setAgg] = useState<Agg>(new Map());
  const [countries, setCountries] = useState<string[]>([]);
  const [sectorsAll, setSectorsAll] = useState<Set<string>>(new Set());
  const [country, setCountry] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const didRun = useRef(false); // prevent StrictMode double-run in dev

  // helpers
  const toYear = (r: AnyRow): number | null => {
    if (r.year != null) return Number(r.year);
    if (r.Year != null) return Number(r.Year);
    if (r.timestamp != null) return new Date(Number(r.timestamp) * 1000).getFullYear();
    if (r.Timestamp != null) return new Date(Number(r.Timestamp) * 1000).getFullYear();
    const dStr = r.date ?? r.Date;
    if (dStr) {
      const d = new Date(String(dStr));
      return isNaN(d.getTime()) ? null : d.getFullYear();
    }
    return null;
  };
  const sectorOf = (r: AnyRow): string => String(r.sector ?? r.Sector ?? "").trim();
  const countryOf = (r: AnyRow): string => String(r.country ?? r.Country ?? "").trim();
  const valueOf = (r: AnyRow): number | null => {
    const v = r.value ?? r.Value ?? null;
    if (v == null) return null;
    const n = typeof v === "string" ? Number(v.replace(/,/g, "")) : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  // Stream parse once and aggregate into a tiny map
  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const A: Agg = new Map();
    const cSet = new Set<string>();
    const sSet = new Set<string>();

    Papa.parse<AnyRow>(CSV_URL, {
      download: true,
      header: true,
      worker: true,
      skipEmptyLines: true,
      step: ({ data }) => {
        const y = toYear(data);
        const s = sectorOf(data);
        const c = countryOf(data);
        const v = valueOf(data);
        if (y == null || !Number.isFinite(y) || !s || !c || v == null) return;

        cSet.add(c);
        sSet.add(s);

        let bySector = A.get(c);
        if (!bySector) { bySector = new Map(); A.set(c, bySector); }
        let byYear = bySector.get(s);
        if (!byYear) { byYear = new Map(); bySector.set(s, byYear); }
        byYear.set(y, (byYear.get(y) ?? 0) + v);
      },
      complete: () => {
        const list = Array.from(cSet).sort();
        setAgg(A);
        setCountries(list);
        setSectorsAll(sSet);
        // set a sensible default country (prefer WORLD, else US, else first)
        const preferred = ["WORLD", "US", "EU27 & UK", "China", "India"];
        const pick = preferred.find(p => list.includes(p)) ?? list[0] ?? "";
        setCountry(pick);
        setLoading(false);
      },
      error: (e) => {
        setErr(e.message || "Failed to parse CSV");
        setLoading(false);
      },
    });
  }, []);

  // Build wide rows for the selected country: {year, Power, Industry, Transport, ...}
  const { dataWide, sectorKeys } = useMemo(() => {
    if (!country || !agg.has(country)) return { dataWide: [] as WideRow[], sectorKeys: [] as string[] };

    const bySector = agg.get(country)!; // Map<sector, Map<year, value>>
    const sectors = Array.from(bySector.keys()).sort();

    // choose up to 5 sectors to keep chart readable (or lock to known ones)
    const preferred = ["Power","Industry","Transport","Buildings","Agriculture"];
    const ordered = [
      ...preferred.filter(s => sectors.includes(s)),
      ...sectors.filter(s => !preferred.includes(s)),
    ];
    const keep = ordered.slice(0, 5);

    // collect all years for this country across kept sectors
    const yearSet = new Set<number>();
    for (const s of keep) {
      for (const y of (bySector.get(s)?.keys() ?? [])) yearSet.add(y);
    }
    const years = Array.from(yearSet).sort((a,b) => a - b);

    const rows: WideRow[] = years.map(y => {
      const r: WideRow = { year: y };
      for (const s of keep) {
        r[s] = bySector.get(s)?.get(y) ?? null;
      }
      return r;
    });

    return { dataWide: rows, sectorKeys: keep };
  }, [agg, country]);

  const fmt = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <section aria-labelledby="analytics-heading">
      <h1 id="analytics-heading" className="text-2xl font-semibold mb-2">Emissions Analytics</h1>
      <p className="text-gray-700 mb-4">
        Select a country to compare sectors over time. Values shown in <strong>GtCO₂</strong>.{" "}
        {err ? <span className="text-red-600">(Note: {err})</span> : null}
      </p>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Country:</span>
          <select
            className="border rounded px-2 py-1"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <span className="text-xs text-gray-500">
          Sectors detected: {sectorsAll.size}
        </span>
      </div>

      <div style={{ height: 420, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dataWide} margin={{ left: 12, right: 12, top: 8, bottom: 28 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" tickMargin={8}>
              <Label value="Year" position="insideBottom" offset={-18} />
            </XAxis>
            <YAxis width={84} tickFormatter={(v: number) => fmt.format(Number(v))}>
              <Label
                value="Emissions (GtCO₂)"
                angle={-90}
                position="insideLeft"
                offset={10}
                style={{ textAnchor: "middle" }}
              />
            </YAxis>
            <Tooltip
              formatter={(value: any, name: any) => [`${fmt.format(Number(value))} GtCO₂`, name]}
              labelFormatter={(label: any) => `Year: ${label}`}
            />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: 8 }} />
            {sectorKeys.map((s, i) => (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                stroke={palette[i % palette.length]}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
