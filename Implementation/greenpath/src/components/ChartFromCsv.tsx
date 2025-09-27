import { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Label,
} from "recharts";

// If your file is named differently, change this:
const CSV_URL = "/data/dataset.csv";

// This expects data shaped like: [{ year: 2018, power: 1.06, transport: 0.98 }, ...]
export default function ChartFromCsv() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Papa.parse(CSV_URL, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = (res.data as any[]).filter(Boolean);
        setData(rows);
        setLoading(false);
      },
      error: (e) => {
        setErr(e.message || "Failed to load CSV");
        setLoading(false);
      },
    });
  }, []);

  const fmt = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const tooltip = (props: any) => {
    const { active, payload, label } = props;
    if (!active || !payload || !payload.length) return null;
    return (
      <div style={{ background: "white", border: "1px solid #ddd", padding: "8px 10px", borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Year: {label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey}>
            <span style={{ display: "inline-block", width: 10, height: 10, background: p.color, marginRight: 6, borderRadius: 999 }} />
            {p.dataKey}: {fmt.format(p.value)} GtCO₂
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <div className="p-4">Loading…</div>;
  if (err) return <div className="p-4 text-red-600">Error: {err}</div>;

  return (
    <div className="w-full h-[420px] rounded-2xl p-4 bg-white shadow">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 24, left: 8, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" tickMargin={8}>
            <Label value="Year" position="insideBottom" offset={-18} />
          </XAxis>
          <YAxis tickFormatter={(v) => fmt.format(Number(v))} width={70}>
            <Label
              value="Emissions (GtCO₂)"
              angle={-90}
              position="insideLeft"
              offset={10}
              style={{ textAnchor: "middle" }}
            />
          </YAxis>
          <Tooltip content={tooltip} />
          <Legend verticalAlign="bottom" height={36} />
          {/* Change dataKey names if your columns differ */}
          <Line type="monotone" dataKey="power" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="transport" stroke="#82ca9d" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
