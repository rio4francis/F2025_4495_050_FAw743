// src/components/UnifiedRankingTable.tsx
import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

type AggRow = { country: string; sector: string; year: number; value: number };

type LatestRow = {
  country: string;
  y2018: number;
  yLatest: number;
  absChange: number;
  pctChange: number;
};

type SectorYearRow = { country: string; total: number };

const CSV_URL = "/data/agg.csv";
const fmt = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 2 });

export default function UnifiedRankingTable() {
  const [rows, setRows] = useState<AggRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // tabs
  const [tab, setTab] = useState<"sector" | "latest">("sector");

  // filters (sector/year)
  const [sector, setSector] = useState<string>("__TOTAL__");
  const [year, setYear] = useState<number | "latest">("latest");

  // search
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (cancel) return;
        const data = (res.data as any[]).map((r) => ({
          country: String(r.country),
          sector: String(r.sector),
          year: Number(r.year),
          value: Number(r.value || 0),
        })) as AggRow[];
        setRows(data);
        setLoading(false);
      },
      error: (e) => {
        if (!cancel) {
          setErr(e.message || "CSV parse error");
          setLoading(false);
        }
      },
    });
    return () => {
      cancel = true;
    };
  }, []);

  // lists
  const years = useMemo(
    () => Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => a - b),
    [rows]
  );
  const sectors = useMemo(
    () => Array.from(new Set(rows.map((r) => r.sector))).sort(),
    [rows]
  );

  // default latest year
  useEffect(() => {
    if (year === "latest" && years.length) setYear(years[years.length - 1]);
  }, [years, year]);

  /* ---------- Tab: Latest totals (with change since 2018) ---------- */
  const latestData: LatestRow[] = useMemo(() => {
    if (!years.length) return [];
    const y0 = 2018;
    const yL = years[years.length - 1];
    const map = new Map<string, { y0: number; yL: number }>();
    for (const r of rows) {
      if (r.year !== y0 && r.year !== yL) continue;
      const cur = map.get(r.country) || { y0: 0, yL: 0 };
      if (r.year === y0) cur.y0 += r.value;
      if (r.year === yL) cur.yL += r.value;
      map.set(r.country, cur);
    }
    const out: LatestRow[] = [];
    map.forEach((v, country) => {
      const abs = v.yL - v.y0;
      const pct = v.y0 === 0 ? 0 : abs / v.y0;
      out.push({
        country,
        y2018: v.y0,
        yLatest: v.yL,
        absChange: abs,
        pctChange: pct,
      });
    });
    const q = query.trim().toLowerCase();
    return out
      .filter((r) => !q || r.country.toLowerCase().includes(q))
      .sort((a, b) => b.yLatest - a.yLatest);
  }, [rows, years, query]);

  /* ---------- Tab: By Sector & Year ---------- */
  const sectorYearData: SectorYearRow[] = useMemo(() => {
    // Guard: year can be "latest" until default is applied
    if (!years.length || year === "latest") return [];
    const map = new Map<string, number>();
    for (const r of rows) {
      if (r.year !== year) continue;
      if (sector !== "__TOTAL__" && r.sector !== sector) continue;
      map.set(r.country, (map.get(r.country) || 0) + r.value);
    }
    const q = query.trim().toLowerCase();
    return Array.from(map.entries())
      .map(([country, total]) => ({ country, total }))
      .filter((r) => !q || r.country.toLowerCase().includes(q))
      .sort((a, b) => b.total - a.total);
  }, [rows, sector, year, years, query]);

  return (
    <section className="mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          className={`px-3 py-1 rounded border ${
            tab === "sector" ? "bg-emerald-100 border-emerald-300" : "border-emerald-200"
          }`}
          onClick={() => setTab("sector")}
        >
          Ranking by Sector &amp; Year
        </button>
        <button
          type="button"
          className={`px-3 py-1 rounded border ${
            tab === "latest" ? "bg-emerald-100 border-emerald-300" : "border-emerald-200"
          }`}
          onClick={() => setTab("latest")}
        >
          Latest Totals (change since 2018)
        </button>

        <div className="ml-auto">
          <input
            type="search"
            placeholder="Search country…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {tab === "sector" && (
        <>
          <h2 className="text-2xl font-semibold text-emerald-900 mb-2">
            Ranking by Sector&nbsp;&amp;&nbsp;Year
          </h2>
          <p className="text-emerald-800/80 mb-3">
            Pick a year and optionally a sector to rank countries. Choose <em>Total</em> to
            sum across all sectors.
          </p>

          <div className="flex flex-wrap gap-3 items-center mb-3">
            <label className="text-sm">
              Year:&nbsp;
              <select
                className="border rounded px-2 py-1"
                value={year === "latest" ? "" : String(year)}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              Sector:&nbsp;
              <select
                className="border rounded px-2 py-1"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              >
                <option value="__TOTAL__">Total (all sectors)</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="overflow-x-auto rounded-xl border border-emerald-100 shadow-sm bg-white">
            <table className="min-w-[560px] w-full">
              <thead className="bg-emerald-50/70">
                <tr>
                  <th className="text-left px-3 py-2 text-emerald-900">#</th>
                  <th className="text-left px-3 py-2 text-emerald-900">Country</th>
                  <th className="text-left px-3 py-2 text-emerald-900">
                    {sector === "__TOTAL__" ? "Total" : sector} in {year !== "latest" ? year : ""}
                    <span className="ml-1 text-emerald-900/60">(GtCO₂)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-emerald-800/70">
                      Loading…
                    </td>
                  </tr>
                )}
                {err && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-red-600">
                      Error: {err}
                    </td>
                  </tr>
                )}
                {!loading &&
                  !err &&
                  sectorYearData.slice(0, 100).map((r, i) => (
                    <tr key={r.country} className="border-t border-emerald-100">
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{r.country}</td>
                      <td className="px-3 py-2 font-medium">{fmt(r.total)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "latest" && (
        <>
          <h2 className="text-2xl font-semibold text-emerald-900 mb-2">
            Global Ranking (Latest Year)
          </h2>
          <p className="text-emerald-800/80 mb-3">
            Snapshot of totals in the most recent year, plus change since 2018 (▲ increase, ▼ reduction).
          </p>

          <div className="overflow-x-auto rounded-xl border border-emerald-100 shadow-sm bg-white">
            <table className="min-w-[760px] w-full">
              <thead className="bg-emerald-50/70">
                <tr>
                  <th className="text-left px-3 py-2 text-emerald-900">Country</th>
                  <th className="text-left px-3 py-2 text-emerald-900">Latest Total</th>
                  <th className="text-left px-3 py-2 text-emerald-900">Abs Change (’18→Latest)</th>
                  <th className="text-left px-3 py-2 text-emerald-900">% Change</th>
                  <th className="text-left px-3 py-2 text-emerald-900">2018 Total</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-emerald-800/70">
                      Loading…
                    </td>
                  </tr>
                )}
                {err && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-red-600">
                      Error: {err}
                    </td>
                  </tr>
                )}
                {!loading &&
                  !err &&
                  latestData.slice(0, 50).map((r) => (
                    <tr key={r.country} className="border-t border-emerald-100">
                      <td className="px-3 py-2">{r.country}</td>
                      <td className="px-3 py-2 font-medium">{fmt(r.yLatest)}</td>
                      <td
                        className={`px-3 py-2 ${
                          r.absChange >= 0 ? "text-red-700" : "text-emerald-700"
                        }`}
                      >
                        {r.absChange >= 0 ? "▲" : "▼"} {fmt(Math.abs(r.absChange))}
                      </td>
                      <td
                        className={`px-3 py-2 ${
                          r.pctChange >= 0 ? "text-red-700" : "text-emerald-700"
                        }`}
                      >
                        {(r.pctChange * 100).toFixed(1)}%
                      </td>
                      <td className="px-3 py-2">{fmt(r.y2018)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
