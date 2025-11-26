// src/layout/RootLayout.tsx
import React from "react";
import { Outlet, NavLink } from "react-router-dom";

export default function RootLayout() {
  // --- styles kept inline to avoid external overrides ---
  const bar: React.CSSProperties = {
    background: "#0e5f3a", // gp.green
    color: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 50,
    boxShadow: "0 6px 20px rgba(0,0,0,.12)",
  };

  const wrap: React.CSSProperties = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
  };

  const brand: React.CSSProperties = {
    fontWeight: 900,
    fontSize: 30,
    letterSpacing: 0.3,
    userSelect: "none",
    color: "#fff",
  };

  const navWrap: React.CSSProperties = {
    marginLeft: "auto",
    display: "flex",
    gap: 12,
  };

  const pillBase: React.CSSProperties = {
    padding: "10px 16px",
    fontWeight: 800,
    fontSize: 16,
    color: "#fff",
    textDecoration: "none",
    borderRadius: 9999,
    border: "1px solid rgba(255,255,255,0.35)",
    transition: "background .12s ease, border-color .12s ease",
  };

  const pillActive: React.CSSProperties = {
    background: "rgba(255,255,255,.20)",
    borderColor: "rgba(255,255,255,.60)",
  };

  const divider: React.CSSProperties = {
    height: 6,
    width: "100%",
    background: "rgba(255,255,255,.15)",
  };

  const styleFor = (active: boolean): React.CSSProperties => ({
    ...pillBase,
    ...(active ? pillActive : null),
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(140deg,#fff,#ecf8f2 60%)",
        color: "#223c2f",
      }}
    >
      {/* ===== HEADER ===== */}
      <header style={bar}>
        <nav aria-label="Primary" style={wrap}>
          <span style={brand}>GreenPath</span>

          <div style={navWrap}>
            <NavLink to="/" end style={({ isActive }) => styleFor(isActive)}>
              Home
            </NavLink>
            <NavLink
              to="/categories"
              style={({ isActive }) => styleFor(isActive)}
            >
              Categories
            </NavLink>
            <NavLink
              to="/analytics"
              style={({ isActive }) => styleFor(isActive)}
            >
              Analytics
            </NavLink>
            {/* NEW: ML Analytics as a main page/pill beside Analytics */}
            <NavLink
              to="/analyticsml"
              style={({ isActive }) => styleFor(isActive)}
            >
              ML Analytics
            </NavLink>
            <NavLink to="/chat" style={({ isActive }) => styleFor(isActive)}>
              Chat
            </NavLink>
          </div>
        </nav>
        <div style={divider} />
        {/* keep links white inside header (kills visited purple) */}
        <style>
          {`header a:link, header a:visited, header a:hover, header a:active { color:#fff !important; text-decoration:none !important; }`}
        </style>
      </header>

      {/* ===== MAIN ===== */}
      <main
        style={{ maxWidth: 1200, margin: "24px auto 0", padding: "0 24px" }}
        role="main"
      >
        <Outlet />
      </main>

      {/* ===== FOOTER ===== */}
      <footer
        style={{
          maxWidth: 1200,
          margin: "40px auto 0",
          padding: "24px",
          borderTop: "1px solid #e4efe8",
          display: "flex",
          justifyContent: "space-between",
          fontSize: 14,
          color: "#667b6f",
        }}
      >
        <div>
          © {new Date().getFullYear()} GreenPath — Sustainable Products &
          Insights
        </div>
        <nav style={{ display: "flex", gap: 12 }}>
           <NavLink to="/categories">Categories</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
          {/* NEW: footer link */}
          <NavLink to="/analyticsml">ML Analytics</NavLink>
         
          <NavLink to="/chat">Chat</NavLink>
        </nav>
      </footer>
    </div>
  );
}
