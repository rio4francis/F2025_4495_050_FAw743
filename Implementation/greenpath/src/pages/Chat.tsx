// src/pages/Chat.tsx
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant" | "system"; content: string };

/**
 * Robust API base:
 * - Prefer VITE_CHAT_API_URL (if you created it), otherwise VITE_API_URL
 * - Strip any query string and trailing slashes so we can safely append /chat
 */
const RAW_ENV = (import.meta as any).env || {};
const API_BASE = (RAW_ENV.VITE_CHAT_API_URL || RAW_ENV.VITE_API_URL || "")
  .replace(/\?.*$/, "")
  .replace(/\/+$/, "");

export default function Chat() {
  const styles = (
    <style>{`
      :root{
        --fz-heading: clamp(24px, 3.2vw, 36px);
        --fz-body: clamp(15px, 1.9vw, 16px);
        --clr-heading: #0e5f3a; --clr-body: #223c2f;
        --border:#e4efe8; --panel:#fff; --panel-soft:#f6fbf8;
        --green:#127c4c; --green-2:#14935a;
      }
      .pg{ font-size:var(--fz-body); color:var(--clr-body); line-height:1.6; letter-spacing:.1px; }
      .hd{ font-size:var(--fz-heading); color:var(--clr-heading); font-weight:900; margin:0 0 10px; }
      .subtle{ opacity:.9; }
      .wrap{ display:grid; grid-template-columns: 300px 1fr; gap:14px; }
      @media (max-width: 980px){ .wrap{ grid-template-columns: 1fr; } }
      .panel{ background:var(--panel); border:1px solid var(--border); border-radius:16px; box-shadow:0 10px 26px rgba(0,0,0,.06); padding:14px; }
      .chips{ display:flex; flex-wrap:wrap; gap:8px; }
      .chip{ border:1px solid var(--border); background:#fff; border-radius:999px; padding:6px 10px; cursor:pointer; }
      .chat{ display:flex; flex-direction:column; gap:10px; height:64vh; min-height:420px; }
      .log{ flex:1; overflow:auto; background:var(--panel-soft); border:1px solid var(--border); border-radius:14px; padding:10px; }
      .row{ display:flex; gap:10px; margin:8px 0; }
      .me{ justify-content:flex-end; }
      .bubble{ max-width:75%; padding:10px 12px; border-radius:14px; border:1px solid var(--border); background:#fff; }
      .mine{ background:linear-gradient(135deg, var(--green), var(--green-2)); color:#fff; border:none; }
      .composer{ display:flex; gap:8px; }
      .input{ flex:1; border:1px solid var(--border); border-radius:12px; padding:10px 12px; }
      .btn{ padding:10px 14px; border-radius:12px; color:#fff; font-weight:900; background:linear-gradient(135deg, var(--green), var(--green-2)); border:1px solid rgba(18,124,76,.2); }
      .formRow{ display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-top:8px; }
      @media (max-width: 520px){ .formRow{ grid-template-columns: 1fr; } }
      .label{ font-weight:800; color:var(--clr-heading); }
      .hint{ font-size:12px; opacity:.8; }
    `}</style>
  );

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi! I’m your GreenPath assistant. Ask me about emissions trends or sustainable product choices. You can also pick a prompt on the left.",
    },
  ]);
  const [text, setText] = useState("");
  const [country, setCountry] = useState("WORLD");
  const [sector, setSector] = useState<string>("(any)");
  const [years, setYears] = useState("2018–2023");
  const [loading, setLoading] = useState(false);
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
        {
          role: "assistant",
          content:
            "API not configured. Set VITE_API_URL (or VITE_CHAT_API_URL) and rebuild the app.",
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [...msgs, userMsg].slice(-12),
          context: { country, sector: sector === "(any)" ? undefined : sector, years },
        }),
      });
      const data = await res.json();
      const reply =
        typeof data?.reply === "string"
          ? data.reply
          : "Sorry — I couldn’t generate a response.";
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: `Error: ${e?.message || String(e)}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Which sector is rising fastest globally?",
    "Give me low-emission tips for home heating.",
    "Compare EV vs. public transit for urban commutes.",
    "Which countries reduced power sector emissions since 2018?",
  ];

  return (
    <section className="pg">
      {styles}
      <h1 className="hd">Chat</h1>
      <p className="subtle" style={{ marginBottom: 10 }}>
        Ask sustainability questions or tap a prompt. Context filters help tailor responses to your focus area.
      </p>

      <div className="wrap">
        <aside className="panel">
          <div className="label">Quick prompts</div>
          <div className="chips" style={{ marginTop: 6 }}>
            {quickPrompts.map((p) => (
              <button key={p} className="chip" onClick={() => send(p)} aria-label={p}>
                {p}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12 }} className="label">
            Context
          </div>
          <div className="formRow">
            <label>
              <div className="hint">Country</div>
              <input
                className="input"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </label>
            <label>
              <div className="hint">Sector</div>
              <select
                className="input"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              >
                <option>(any)</option>
                <option>Power</option>
                <option>Industry</option>
                <option>Ground transport</option>
                <option>Residential</option>
                <option>Domestic aviation</option>
                <option>International aviation</option>
              </select>
            </label>
          </div>
          <label style={{ display: "block", marginTop: 8 }}>
            <div className="hint">Years (free text)</div>
            <input
              className="input"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              placeholder="e.g., 2018–2023 or 2020–"
            />
          </label>
        </aside>

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
