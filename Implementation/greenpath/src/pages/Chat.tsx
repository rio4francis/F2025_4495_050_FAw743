// src/pages/Chat.tsx

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const API_BASE =
  (import.meta as any).env?.VITE_CHAT_API_URL?.replace(/\?.*$/, "").replace(/\/+$/, "") ||
  (import.meta as any).env?.VITE_API_URL?.replace(/\?.*$/, "").replace(/\/+$/, "") ||
  "";

export default function Chat() {
  const styles = (
    <style>{`
      html { scrollbar-gutter: stable both-edges; }

      :root{
        --fz-heading: clamp(24px, 3.2vw, 36px);
        --fz-body: clamp(15px, 1.9vw, 16px);
        --clr-heading:#0e5f3a; --clr-body:#223c2f;
        --border:#e4efe8; --panel:#fff; --panel-soft:#f6fbf8;
        --green:#127c4c; --green-2:#14935a;
      }

      .pg{
        font-size:var(--fz-body);
        color:var(--clr-body);
        line-height:1.6;
        letter-spacing:.1px;
      }

      .hdRow{
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        margin-bottom:8px;
      }
      .hd{
        font-size:var(--fz-heading);
        color:var(--clr-heading);
        font-weight:900;
        margin:0;
      }
      .toggle{
        padding:8px 12px;
        border-radius:999px;
        border:1px solid var(--border);
        background:#fff;
        cursor:pointer;
        font-weight:800;
        box-shadow:0 4px 10px rgba(0,0,0,.04);
      }
      .toggle:hover{
        background:#f4faf6;
      }

      .pageIntro{
        margin:0 0 14px;
        color:#395749;
      }

      .layout{
        display:grid;
        gap:14px;
      }
      .layout.cols{
        grid-template-columns: 320px 1fr;
      }
      @media (max-width: 980px){
        .layout.cols{ grid-template-columns: 1fr; }
      }

      .panel{
        background:var(--panel);
        border:1px solid var(--border);
        border-radius:16px;
        box-shadow:0 10px 26px rgba(0,0,0,.06);
        padding:14px;
      }

      /* Assistant header card */
      .assistantHeader{
        display:flex;
        align-items:flex-start;
        gap:10px;
        padding:10px 12px;
        border-radius:14px;
        background:linear-gradient(135deg,#0f5132,#178f57);
        color:#f4fff9;
        margin-bottom:10px;
      }
      .assistantIcon{
        width:38px; height:38px;
        border-radius:999px;
        background:#fff;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:22px;
        flex-shrink:0;
        box-shadow:0 6px 14px rgba(0,0,0,.25);
      }
      .assistantHeaderText h2{
        margin:0;
        font-size:18px;
        font-weight:900;
      }
      .assistantHeaderText p{
        margin:2px 0 0;
        font-size:13px;
        opacity:.95;
      }

      /* Prompts panel */
      .sectionTitle{
        font-weight:900;
        color:var(--clr-heading);
        margin-bottom:6px;
      }
      .chips{
        display:flex;
        flex-wrap:wrap;
        gap:8px;
      }
      .chip{
        border:1px solid var(--border);
        background:#fff;
        border-radius:999px;
        padding:6px 10px;
        cursor:pointer;
        font-size:13px;
        line-height:1.3;
      }
      .chip:hover{
        background:#f0f7f3;
        border-color:#c8e8d6;
      }
      .group{ margin-bottom:14px; }

      /* Chat layout */
      .chat{
        display:flex;
        flex-direction:column;
        gap:8px;
        height: calc(100vh - 210px);
        min-height: 520px;
      }
      @media (max-width: 768px){
        .chat{
          height: calc(100vh - 230px);
          min-height: 460px;
        }
      }

      .log{
        flex:1;
        overflow-y:auto;
        background:var(--panel-soft);
        border:1px solid var(--border);
        border-radius:14px;
        padding:10px 8px;
        scroll-behavior: smooth;
        box-shadow: inset 0 2px 6px rgba(0,0,0,.03);
      }

      .row{
        display:flex;
        gap:8px;
        margin:6px 0;
      }
      .row.me{
        justify-content:flex-end;
      }

      .avatar{
        width:30px; height:30px;
        border-radius:999px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:16px;
        flex-shrink:0;
      }
      .avatar.bot{
        background:#0f5132;
        color:#f4fff9;
      }
      .avatar.user{
        background:linear-gradient(135deg,var(--green),var(--green-2));
        color:#fff;
      }

      .bubble{
        max-width:75%;
        padding:9px 11px;
        border-radius:14px;
        border:1px solid var(--border);
        background:#fff;
        white-space: pre-wrap;
        font-size:var(--fz-body);
      }
      .mine{
        background:linear-gradient(135deg, var(--green), var(--green-2));
        color:#fff;
        border:none;
      }

      /* Markdown cleanup */
      .bubble :where(p){ margin:0 0 .45rem 0; }
      .bubble :where(ul,ol){ margin:.25rem 0 .6rem 1.25rem; padding:0; }
      .bubble :where(li){ margin:.18rem 0; }
      .bubble :where(code,pre){
        background:#f6fbf8;
        border:1px solid #e4efe8;
        border-radius:6px;
        padding:0 .25rem;
      }
      .bubble :where(h1,h2,h3,h4){ margin:.25rem 0; font-size:1em; font-weight:700; }
      .bubble :where(a){ color:#0e5f3a; text-decoration:underline; }

      /* Composer */
      .composer{
        display:flex;
        gap:8px;
        padding:6px 2px 0;
        align-items:center;
      }
      .input{
        flex:1;
        border:1px solid var(--border);
        border-radius:999px;
        padding:10px 14px;
        font-size:var(--fz-body);
      }
      .input:focus{
        outline:none;
        border-color:#9fd9ba;
        box-shadow:0 0 0 2px #d6f2e1;
      }
      .btn{
        padding:10px 16px;
        border-radius:999px;
        color:#fff;
        font-weight:900;
        background:linear-gradient(135deg, var(--green), var(--green-2));
        border:1px solid rgba(18,124,76,.2);
        cursor:pointer;
        display:flex;
        align-items:center;
        gap:6px;
        white-space:nowrap;
      }
      .btn[disabled]{
        opacity:.6;
        cursor:default;
      }

      .powered{
        margin-top:4px;
        font-size:12px;
        color:#6a8274;
      }
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
  const [showPrompts, setShowPrompts] = useState(false);

  // only scroll the chat log (not the entire page)
  const logRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, loading]);

  const normalizeForMarkdown = (s: string) =>
    s.replace(/^(\s*)•/gm, "$1-").trim();

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
            "API not configured. Set VITE_CHAT_API_URL (or VITE_API_URL) to enable chat.",
        },
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
      const reply =
        typeof data?.reply === "string"
          ? data.reply
          : "Sorry — I couldn’t generate a response right now.";
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: `Error: ${e?.message || e}` },
      ]);
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
      <p className="pageIntro">
        Talk to the <strong>GreenPath Assistant</strong> about emissions trends, country
        comparisons, and everyday sustainable choices. You can type a question or tap one
        of the suggested prompts.
      </p>

      <div className={`layout ${showPrompts ? "cols" : ""}`}>
        {showPrompts && (
          <aside className="panel">
            {Object.entries(prompts).map(([group, items]) => (
              <div key={group} className="group">
                <div className="sectionTitle">{group}</div>
                <div className="chips">
                  {items.map((p) => (
                    <button
                      key={p}
                      className="chip"
                      onClick={() => send(p)}
                      aria-label={p}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>
        )}

        <div className="panel chat">
          {/* Assistant header card */}
          <div className="assistantHeader">
            <div className="assistantIcon">🤖</div>
            <div className="assistantHeaderText">
              <h2>GreenPath Assistant</h2>
              <p>
                Welcome!!! Let's discuss sustainability and its benefits.
              </p>
            </div>
          </div>

          {/* Chat log */}
          <div ref={logRef} className="log">
            {msgs.map((m, i) => (
              <div key={i} className={`row ${m.role === "user" ? "me" : ""}`}>
                {m.role !== "user" && (
                  <div className="avatar bot" aria-hidden="true">
                    🤖
                  </div>
                )}

                <div className={`bubble ${m.role === "user" ? "mine" : ""}`}>
                  {m.role === "assistant" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {normalizeForMarkdown(m.content || "")}
                    </ReactMarkdown>
                  ) : (
                    m.content
                  )}
                </div>

                {m.role === "user" && (
                  <div className="avatar user" aria-hidden="true">
                    You
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="row">
                <div className="avatar bot" aria-hidden="true">
                  🤖
                </div>
                <div className="bubble">Thinking…</div>
              </div>
            )}
          </div>

          {/* Input area */}
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
          >
            <input
              className="input"
              placeholder="Ask about emissions trends, comparisons, or sustainable product choices…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="btn" type="submit" disabled={loading}>
              <span>Send</span>
              <span aria-hidden="true">➤</span>
            </button>
          </form>

          <div className="powered">
            Powered by OpenAI &amp; the GreenPath aggregated emissions dataset (agg.csv, 2018–2023).
          </div>
        </div>
      </div>
    </section>
  );
}
