import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
} from "recharts";

type CumItem = { country: string; total: number };
type Props = {
  /** Optional: pass precomputed Top-5 cumulative totals */
  data?: CumItem[];
  /** Optional CSV path if the component should compute by itself */
  csvUrl?: string;
};

const CSV_DEFAULT = "/data/agg.csv";
/** Rank colors (1→5): blue, amber, emerald, red, violet */
const TOP5_COLORS = ["#2563eb", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

export default function TopFiveSnapshot({ data, csvUrl = CSV_DEFAULT }: Props) {
  const [internal, setInternal] = useState<CumItem[]>([]);
  const [loading, setLoading] = useState<boolean>(!data);
  const [err, setErr] = useState<string | null>(null);

  // If parent passes data, use it; else load CSV and compute.
  useEffect(() => {
    if (data && data.length) {
      setInternal(data);
      setLoading(false);
      setErr(null);
      return;
    }
    setLoading(true);
    setErr(null);
    let cancel = false;

    Papa.parse(csvUrl, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (cancel) return;
        try {
          const totals = new Map<string, number>();
          (res.data as any[]).forEach((r) => {
            const c = String(r.country);
            const v = Number(r.value || 0);
            totals.set(c, (totals.get(c) || 0) + v);
          });
          const top5 = Array.from(totals.entries())
            .map(([country, total]) => ({ country, total }))
            .sort((a, b) => b.total - a.total) // highest first
            .slice(0, 5);

          setInternal(top5);
          setLoading(false);
        } catch (e: any) {
          setErr(e?.message || "Failed to compute Top-5 from CSV.");
          setLoading(false);
        }
      },
      error: (e) => {
        if (cancel) return;
        setErr(e.message || "CSV parse error.");
        setLoading(false);
      },
    });

    return () => {
      cancel = true;
    };
  }, [data, csvUrl]);

  // Keep highest → lowest in this order so the Y axis draws Top→Bottom correctly.
  const top5 = useMemo(
    () => (data && data.length ? data : internal),
    [data, internal]
  );

  return (
    <div>
      <div
        style={{
          height: 360,
          borderRadius: 14,
          background: "#f6fbf8",
          border: "1px solid #e4efe8",
          padding: 8,
        }}
        aria-label="Top 5 cumulative totals"
        role="img"
      >
        {loading ? (
          <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#6b7b72" }}>
            Loading…
          </div>
        ) : err ? (
          <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#8a1f11" }}>
            {err}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top5}
              layout="vertical"
              margin={{ left: 24, right: 12, top: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="country" width={95} />
              <Tooltip formatter={(v: any) => Number(v).toLocaleString()} />
              <Bar dataKey="total" radius={[4, 4, 4, 4]}>
                {top5.map((_, idx) => (
                  <Cell key={idx} fill={TOP5_COLORS[idx] || "#16a34a"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Caption */}
      <p style={{ fontSize: 12.5, color: "#4b6256", marginTop: 6 }}>
        Higher bar = higher cumulative emissions across all years in the dataset. Colors indicate rank (1st→5th).
      </p>
    </div>
  );
}
