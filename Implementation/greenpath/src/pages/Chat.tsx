// src/pages/Chat.tsx
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const API_BASE =
  (import.meta as any).env?.VITE_CHAT_API_URL?.replace(/\?.*$/, "").replace(/\/+$/, "") ||
  (import.meta as any).env?.VITE_API_URL?.replace(/\?.*$/, "").replace(/\/+$/, "") ||
  "";

export default function Chat() {
  const styles = (
    <style>{`
      :root{
        --fz-heading: clamp(24px, 3.2vw, 36px);
        --fz-body: clamp(15px, 1.9vw, 16px);
        --clr-heading:#0e5f3a; --clr-body:#223c2f;
        --border:#e4efe8; --panel:#fff; --panel-soft:#f6fbf8;
        --green:#127c4c; --green-2:#14935a;
      }
      .pg{ font-size:var(--fz-body); color:var(--clr-body); line-height:1.6; letter-spacing:.1px; }

      .hdRow{ display:flex; align-items:center; justify-content:space-between; gap:12px; }
      .hd{ font-size:var(--fz-heading); color:var(--clr-heading); font-weight:900; margin:0; }
      .toggle{
        padding:8px 12px; border-radius:12px; border:1px solid var(--border);
        background:#fff; cursor:pointer; font-weight:800;
      }

      /* Layout switches between full-width chat and two-column */
      .layout{ display:grid; gap:14px; }
      .layout.cols{ grid-template-columns: 320px 1fr; }
      @media (max-width: 980px){ .layout.cols{ grid-template-columns: 1fr; } }

      .panel{ background:var(--panel); border:1px solid var(--border); border-radius:16px;
              box-shadow:0 10px 26px rgba(0,0,0,.06); padding:14px; }
      .sectionTitle{ font-weight:900; color:var(--clr-heading); margin-bottom:6px; }
      .chips{ display:flex; flex-wrap:wrap; gap:8px; }
      .chip{ border:1px solid var(--border); background:#fff; border-radius:999px;
             padding:6px 10px; cursor:pointer; }
      .chip:hover{ background:#f0f7f3; }

      /* Make chat nearly full viewport height */
      .chat{
        display:flex; flex-direction:column; gap:10px;
        height: calc(100vh - 220px); min-height: 520px;
      }
      .log{ flex:1; overflow:auto; background:var(--panel-soft); border:1px solid var(--border);
            border-radius:14px; padding:10px; }
      .row{ display:flex; gap:10px; margin:8px 0; }
      .me{ justify-content:flex-end; }
      .bubble{ max-width:75%; padding:10px 12px; border-radius:14px; border:1px solid var(--border); background:#fff; }
      .mine{ background:linear-gradient(135deg, var(--green), var(--green-2)); color:#fff; border:none; }
      .composer{ display:flex; gap:8px; }
      .input{ flex:1; border:1px solid var(--border); border-radius:12px; padding:10px 12px; }
      .btn{ padding:10px 14px; border-radius:12px; color:#fff; font-weight:900;
            background:linear-gradient(135deg, var(--green), var(--green-2));
            border:1px solid rgba(18,124,76,.2); }
      .group{ margin-bottom:14px; }
    `}</style>
  );

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I’m your GreenPath assistant. Ask me about emissions trends, country comparisons, or sustainable product choices. You can also tap a prompt.",
    },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false); // START expanded (no left column)
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs, loading]);

  const send = async (content: string) => {
    if (!content.trim()) return;
    const userMsg: Msg = { role: "user", content };
    setMsgs((m) => [...m, userMsg]);
    setText("");

    if (!API_BASE) {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: "API not configured. Set VITE_CHAT_API_URL (or VITE_API_URL) to enable chat." },
      ]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [...msgs, userMsg].slice(-12) }),
      });
      const data = await res.json();
      const reply = typeof data?.reply === "string" ? data.reply : "Sorry — I couldn’t generate a response right now.";
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "assistant", content: `Error: ${e?.message || e}` }]);
    } finally {
      setLoading(false);
    }
  };

  const prompts = {
    "Quick insights": [
      "Which sector is rising fastest globally since 2018?",
      "Top 5 countries by total emissions in 2023?",
      "Which countries reduced power-sector emissions since 2018?",
      "What’s the trend for residential emissions globally?",
    ],
    "Country comparisons": [
      "Compare US vs China emissions since 2018.",
      "EU27 & UK vs India: which sectors drive the difference?",
      "Rank G7 countries by industry emissions in 2023.",
    ],
    "Actionable tips": [
      "Low-emission tips for home heating.",
      "Ways to cut transport emissions for urban commutes.",
      "How to choose low-carbon materials for building projects.",
      "Reusable alternatives to reduce plastic waste at home.",
    ],
    "Deep dives": [
      "Explain ground transport emission drivers and effective policies.",
      "Why is aviation hard to decarbonize? Give practical steps for travelers.",
      "What factors impact power-sector decarbonization success?",
    ],
  } as const;

  return (
    <section className="pg">
      {styles}

      <div className="hdRow">
        <h1 className="hd">Chat</h1>
        <button className="toggle" onClick={() => setShowPrompts((s) => !s)}>
          {showPrompts ? "Hide prompts" : "Show prompts"}
        </button>
      </div>
      <p className="subtle" style={{ marginBottom: 10 }}>
        Ask any sustainability question or tap a prompt. Answers are concise and focused on practical insight.
      </p>

      <div className={`layout ${showPrompts ? "cols" : ""}`}>
        {showPrompts && (
          <aside className="panel">
            {Object.entries(prompts).map(([group, items]) => (
              <div key={group} className="group">
                <div className="sectionTitle">{group}</div>
                <div className="chips">
                  {items.map((p) => (
                    <button key={p} className="chip" onClick={() => send(p)} aria-label={p}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>
        )}

        <div className="panel chat">
          <div className="log">
            {msgs.map((m, i) => (
              <div key={i} className={`row ${m.role === "user" ? "me" : ""}`}>
                <div className={`bubble ${m.role === "user" ? "mine" : ""}`}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="row">
                <div className="bubble">Thinking…</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
          >
            <input
              className="input"
              placeholder="Type your question…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="btn" type="submit" disabled={loading}>
              Send
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
