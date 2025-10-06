// src/pages/Categories.tsx
import React from "react";
import { Link } from "react-router-dom";

export type Sector =
  | "Power"
  | "Industry"
  | "Ground transport"
  | "Residential"
  | "Domestic aviation"
  | "International aviation"
  | "Other";

export type Category = {
  id: string;
  name: string;
  sector: Sector;
  description: string;        // short summary (list page)
  longDescription: string;    // robust write-up (detail page)
  heroBase?: string;          // image base name in /public/images/categories (defaults to id)
  tags: string[];
  tips: string[];
};

export const CATEGORIES: Category[] = [
  {
    id: "renewable-energy",
    name: "Renewable Energy",
    sector: "Power",
    description:
      "Support low-carbon electricity—solar, wind, community energy, and efficient appliances.",
    longDescription:
      "Renewable energy displaces fossil-based electricity and is one of the most effective levers for system-wide decarbonization. From rooftop PV and community solar to grid-scale wind, the goal is to increase the share of clean generation while improving demand-side efficiency. Pairing renewables with efficient appliances and demand flexibility (like shifting loads to renewables-heavy hours) multiplies the benefits.",
    heroBase: "renewable-energy/hero",
    tags: ["low-carbon", "energy", "efficiency"],
    tips: [
      "Choose green electricity plans or join a community solar program.",
      "Prioritize Energy Star / high-efficiency ratings for major loads.",
      "Use timers/smart plugs to align usage with high renewable output.",
    ],
  },
  {
    id: "efficient-lighting",
    name: "Efficient Lighting",
    sector: "Residential",
    description:
      "LED bulbs and smart controls that cut electricity use and last longer.",
    longDescription:
      "Lighting upgrades are among the fastest, most cost-effective efficiency wins. LED lamps use a fraction of the energy of legacy bulbs and run cooler with long lifespans. Smart dimmers and occupancy sensors reduce waste further, while color temperature selection supports comfort and adoption.",
    heroBase: "efficient-lighting/hero",
    tags: ["home", "energy", "LED"],
    tips: [
      "Swap high-use fixtures first (kitchen, living room, exterior).",
      "Add occupancy or daylight sensors in low-traffic areas.",
      "Pick warm CCT for living spaces to improve acceptance.",
    ],
  },
  {
    id: "ev-and-micromobility",
    name: "EV & Micromobility",
    sector: "Ground transport",
    description:
      "EVs, e-bikes, and e-scooters shift trips to lower-emission modes.",
    longDescription:
      "Electrified mobility reduces tailpipe emissions and improves local air quality, especially on grids with rising renewable penetration. Right-sizing vehicles and substituting short car trips with e-bikes can cut energy use and congestion. Smart charging during off-peak or renewable-heavy periods further lowers the carbon intensity.",
    heroBase: "ev-and-micromobility/hero",
    tags: ["transport", "electric", "mobility"],
    tips: [
      "Match vehicle to typical trip length and cargo needs.",
      "Prefer off-peak or green-window charging when possible.",
      "For <5 km trips, try e-bikes over cars.",
    ],
  },
  {
    id: "public-transit",
    name: "Public Transit & Shared Mobility",
    sector: "Ground transport",
    description:
      "Increase occupancy and reduce per-passenger emissions through transit and sharing.",
    longDescription:
      "Well-used public transit and shared mobility spread energy use over more passengers, reducing per-km emissions while easing congestion. Effective behavior change combines service reliability, user information, and safe first/last-mile options like protected cycling.",
    heroBase: "public-transit/hero",
    tags: ["transport", "shared", "access"],
    tips: [
      "Bundle errands and plan routes with real-time apps.",
      "Advocate for safe bike+transit connections in your area.",
      "Leverage transit passes/subscriptions to normalize usage.",
    ],
  },
  {
    id: "low-carbon-materials",
    name: "Low-Carbon Materials",
    sector: "Industry",
    description:
      "Materials with recycled content, low-carbon processes, or bio-based feedstocks.",
    longDescription:
      "Material selection shapes embodied carbon. Choosing recycled metals, lower-clinker cement, and right-sized packaging can materially reduce upstream emissions. For procurement, Environmental Product Declarations (EPDs) provide clarity, enabling apples-to-apples comparisons and verifiable reductions.",
    heroBase: "low-carbon-materials/hero",
    tags: ["materials", "recycled", "industry"],
    tips: [
      "Specify EPD-verified products when possible.",
      "Favor recycled aluminum/steel where specs allow.",
      "Eliminate over-packaging; design for right-sizing.",
    ],
  },
  {
    id: "reusable-foodware",
    name: "Reusable Foodware",
    sector: "Residential",
    description:
      "Durable bottles, cups, and containers that replace single-use plastics.",
    longDescription:
      "Reusable systems cut both waste and upstream emissions from single-use plastics. Durable, dishwasher-safe designs make reuse practical. Standardization and take-back programs increase convenience, while clear guidance prevents contamination and improves health/safety.",
    heroBase: "reusable-foodware/hero",
    tags: ["reusable", "plastic", "waste"],
    tips: [
      "Carry a reusable bottle/mug; look for vendor discounts.",
      "Prefer dishwasher-safe items to simplify habits.",
      "Avoid mixed-material products that hinder recycling.",
    ],
  },
  {
    id: "efficient-heating",
    name: "Efficient Heating & Cooling",
    sector: "Residential",
    description:
      "Heat pumps, smart thermostats, and weatherization for comfort and savings.",
    longDescription:
      "HVAC drives a large share of home energy use. Heat pumps provide efficient heating and cooling; paired with weatherization (air sealing and insulation), they deliver comfort and big energy savings. Smart controls reduce runtime, while routine maintenance preserves performance.",
    heroBase: "efficient-heating/hero",
    tags: ["HVAC", "heat-pump", "insulation"],
    tips: [
      "Seal and insulate first—equipment performs better in tight homes.",
      "Use smart schedules/eco modes for runtime reductions.",
      "Keep filters clean; ensure proper sizing and commissioning.",
    ],
  },
  {
    id: "low-emission-travel",
    name: "Low-Emission Travel",
    sector: "International aviation",
    description:
      "Plan trips to reduce flights; favor rail or virtual where practical.",
    longDescription:
      "Aviation is emissions-intensive per passenger-km. The biggest wins are fewer flights, longer stays per trip, and substituting rail for medium distances. When flying is necessary, non-stop routes typically lower fuel burn; fair, transparent reporting should precede any offsetting.",
    heroBase: "low-emission-travel/hero",
    tags: ["travel", "aviation", "rail"],
    tips: [
      "Consolidate trips; choose non-stop flights when needed.",
      "Prefer electrified rail for medium distances.",
      "Reduce first; offset only for residuals, with credible projects.",
    ],
  },
  {
    id: "circular-products",
    name: "Circular Products & Repair",
    sector: "Other",
    description:
      "Modular, repairable goods and take-back programs that extend lifecycles.",
    longDescription:
      "Circular design extends product life, reduces virgin extraction, and lowers embodied emissions. Repairability, modular components, and certified refurbishment create value while cutting waste. Clear spare-parts access and repair guides accelerate adoption.",
    heroBase: "circular-products/hero",
    tags: ["circular", "repair", "refurbished"],
    tips: [
      "Check repairability scores and parts availability.",
      "Buy certified refurbished when practical.",
      "Prefer modular designs to replace only what fails.",
    ],
  },
];

/* ---------- Inline SVG icons (sector-based) ---------- */
function SectorIcon({ sector }: { sector: Sector }) {
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", "aria-hidden": true } as any;

  switch (sector) {
    case "Power":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M13 2L6 14h5l-1 8 7-12h-5l1-8Z" />
        </svg>
      );
    case "Industry":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 20h18M3 20V9l5 3V9l5 3V7l6-2v15" />
          <path d="M7 20v-4M11 20v-4M15 20v-4M19 20v-4" />
        </svg>
      );
    case "Ground transport":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="7" cy="17" r="3" />
          <circle cx="17" cy="17" r="3" />
          <path d="M7 17l3-6h4l3 6M10 11l-2-2" />
        </svg>
      );
    case "Residential":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 10.5L12 4l9 6.5v7.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7.5Z" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );
    case "Domestic aviation":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M2 12h9l3-3 7-1-5 4 5 4-7-1-3-3H2z" />
        </svg>
      );
    case "International aviation":
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M2 12h8l2-3 10-2-6 5 6 5-10-2-2-3H2z" />
        </svg>
      );
    default:
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 7l2-3 3 2M7 7l2 3-3 2M17 17l-2 3-3-2M17 17l-2-3 3-2" />
        </svg>
      );
  }
}

export default function Categories() {
  const [q, setQ] = React.useState("");
  const [activeSectors, setActiveSectors] = React.useState<string[]>([]);
  const [activeTags, setActiveTags] = React.useState<string[]>([]);

  const allTags = React.useMemo(
    () => Array.from(new Set(CATEGORIES.flatMap((c) => c.tags))).sort(),
    []
  );
  const allSectors = React.useMemo(
    () => Array.from(new Set(CATEGORIES.map((c) => c.sector))),
    []
  );

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
        --green-2: #14935a;
      }
      .page { font-size: var(--fz-body); color: var(--clr-body); line-height: 1.6; letter-spacing:.1px; }
      .heading { font-size: var(--fz-heading); color: var(--clr-heading); font-weight: 900; line-height: 1.2; margin: 0 0 10px 0; }
      .subtle { opacity: .9; }

      .controls { display: grid; grid-template-columns: 1fr; gap: 12px; margin: 12px 0 18px; }
      .searchRow { display: grid; grid-template-columns: 1fr 240px; gap: 10px; }
      @media (max-width: 900px){ .searchRow{ grid-template-columns: 1fr; } }

      .input { width: 100%; border: 1px solid var(--border); border-radius: 12px; padding: 10px 12px; font-size: var(--fz-body); outline: none; }
      .input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(18,124,76,.12); }

      .chips { display: flex; flex-wrap: wrap; gap: 8px; }
      .chip { border: 1px solid var(--border); border-radius: 999px; padding: 6px 10px; cursor: pointer; background: #fff; }
      .chip.active { background: #e9f6ef; border-color: #cbe7d9; }

      .grid { display: grid; gap: 14px; grid-template-columns: repeat(3, 1fr); }
      @media (max-width: 1100px){ .grid{ grid-template-columns: repeat(2,1fr); } }
      @media (max-width: 700px){ .grid{ grid-template-columns: 1fr; } }

      .card { background: var(--panel); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 10px 26px rgba(0,0,0,.06); padding: 16px; display: grid; gap: 10px; transition: box-shadow .15s ease, transform .06s ease; }
      .cardLink { text-decoration: none; color: inherit; }
      .cardLink:hover .card { box-shadow: 0 16px 36px rgba(0,0,0,.10); transform: translateY(-1px); }

      .cardHeader { display:flex; align-items:center; gap: 10px; }
      .iconWrap { width: 36px; height: 36px; border-radius: 10px; display:grid; place-items:center; background: #e9f6ef; color: #127c4c; border: 1px solid #cfe8dc; }
      .cardTitle { font-weight: 900; color: var(--clr-heading); font-size: calc(var(--fz-body) + 2px); }
      .badgeS { display: inline-block; font-size: 12px; font-weight: 800; letter-spacing:.2px; background: linear-gradient(135deg, var(--green), var(--green-2)); color: #fff; padding: 4px 8px; border-radius: 999px; }
      .tips { margin-left: 18px; }
      .footerRow { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
      .link { display:inline-flex; align-items:center; gap: 6px; padding: 8px 12px; border-radius: 12px; border:1px solid rgba(0,0,0,.06); background: linear-gradient(135deg, var(--green), var(--green-2)); color:#fff; font-weight:800; text-decoration:none; box-shadow: 0 8px 18px rgba(18,124,76,.22); }
    `}</style>
  );

  const filtered = React.useMemo(() => {
    const qn = q.trim().toLowerCase();
    return CATEGORIES.filter((cat) => {
      const matchesQ =
        !qn ||
        cat.name.toLowerCase().includes(qn) ||
        cat.description.toLowerCase().includes(qn) ||
        cat.tags.some((t) => t.toLowerCase().includes(qn)) ||
        cat.sector.toLowerCase().includes(qn);

      const matchesSector =
        !activeSectors.length || activeSectors.includes(cat.sector);

      const matchesTags =
        !activeTags.length || activeTags.every((t) => cat.tags.includes(t));

      return matchesQ && matchesSector && matchesTags;
    });
  }, [q, activeSectors, activeTags]);

  const toggleSector = (s: string) =>
    setActiveSectors((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  const toggleTag = (t: string) =>
    setActiveTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  return (
    <div className="page">
      {styles}

      <h1 className="heading">Categories</h1>

      <p className="subtle">
        <strong>The GreenPath Categories page</strong> serves as a guide to different areas of sustainable
        living and production. Each category highlights specific product types or lifestyle choices that
        directly contribute to lowering emissions and promoting resource efficiency. From renewable energy
        and efficient transport to circular materials and household innovations, these categories help you
        connect everyday decisions to measurable environmental impact. By exploring the list, you can
        identify <strong>practical switches and greener alternatives</strong> that align with personal and
        global sustainability goals.
      </p>

      {/* Controls */}
      <div className="controls">
        <div className="searchRow">
          <input
            className="input"
            placeholder='Search categories, e.g. “heat pump”, “lighting”, “reusable”…'
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search categories"
          />
          <Link to="/analytics" className="link" aria-label="Open Analytics">
            Open Analytics →
          </Link>
        </div>

        {/* Sector filter */}
        <div>
          <div style={{ fontWeight: 800, color: "#0e5f3a", marginBottom: 6 }}>
            Filter by sector
          </div>
          <div className="chips">
            {allSectors.map((s) => (
              <button
                type="button"
                key={s}
                className={`chip ${activeSectors.includes(s) ? "active" : ""}`}
                onClick={() => toggleSector(s)}
                aria-pressed={activeSectors.includes(s)}
                aria-label={`Filter by ${s}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Tag filter */}
        <div>
          <div style={{ fontWeight: 800, color: "#0e5f3a", marginBottom: 6 }}>
            Filter by tags
          </div>
          <div className="chips">
            {allTags.map((t) => (
              <button
                type="button"
                key={t}
                className={`chip ${activeTags.includes(t) ? "active" : ""}`}
                onClick={() => toggleTag(t)}
                aria-pressed={activeTags.includes(t)}
                aria-label={`Filter by ${t}`}
              >
                #{t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid">
        {filtered.map((cat) => (
          <Link
            key={cat.id}
            to={`/categories/${encodeURIComponent(cat.id)}`}
            className="cardLink"
            aria-label={`Open details for ${cat.name}`}
          >
            <article className="card" aria-labelledby={`${cat.id}-title`}>
              <div className="badgeS">{cat.sector}</div>
              <header className="cardHeader">
                <span className="iconWrap">
                  <SectorIcon sector={cat.sector} />
                </span>
                <h2 id={`${cat.id}-title`} className="cardTitle">
                  {cat.name}
                </h2>
              </header>
              <p className="subtle" style={{ margin: 0 }}>{cat.description}</p>
              <div>
                <div style={{ fontWeight: 800, color: "#124a34", margin: "6px 0 4px" }}>
                  Impact tips
                </div>
                <ul className="tips">
                  {cat.tips.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
              <div className="footerRow">
                <div className="chips" aria-label="Tags">
                  {cat.tags.map((t) => (
                    <span key={t} className="chip active">#{t}</span>
                  ))}
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {!filtered.length && (
        <div style={{ marginTop: 18, border: "1px solid #e4efe8", borderRadius: 12, padding: 14, background: "#fff" }}>
          No categories match your filters. Try clearing some tags or sector filters.
        </div>
      )}
    </div>
  );
}
