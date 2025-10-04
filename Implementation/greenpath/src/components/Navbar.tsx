import { NavLink } from "react-router-dom";

export default function Navbar() {
  // Inline styles make this look right even if Tailwind isn’t applied
  const barStyle: React.CSSProperties = {
    background: "#127c4c", // rich green
    color: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 50,
    boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const logoStyle: React.CSSProperties = {
    fontWeight: 900,
    fontSize: "30px",          // bolder & larger
    letterSpacing: "0.5px",
    userSelect: "none",
  };

  const linksStyle: React.CSSProperties = {
    display: "flex",
    gap: "12px",
  };

  const linkBase: React.CSSProperties = {
    padding: "10px 16px",
    fontWeight: 700,           // bolder
    fontSize: "18px",          // larger
    color: "#fff",
    textDecoration: "none",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.35)",
    transition: "background 120ms ease, border-color 120ms ease, transform 80ms ease",
  };

  const activeStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.20)",
    borderColor: "rgba(255,255,255,0.6)",
  };

  const hoverStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.55)",
  };

  return (
    <nav style={barStyle}>
      <div style={containerStyle}>
        {/* NON-CLICKABLE logo */}
        <span style={logoStyle}>GreenPath</span>

        <div style={linksStyle}>
          {[
            { to: "/", label: "Home" },
            { to: "/categories", label: "Categories" },
            { to: "/analytics", label: "Analytics" },
            { to: "/chat", label: "Chat" },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                ...linkBase,
                ...(isActive ? activeStyle : null),
              })}
              onMouseEnter={(e) =>
                Object.assign((e.currentTarget as HTMLAnchorElement).style, hoverStyle)
              }
              onMouseLeave={(e) =>
                Object.assign((e.currentTarget as HTMLAnchorElement).style, {
                  background: isActive(to) ? "rgba(255,255,255,0.20)" : "transparent",
                  borderColor: "rgba(255,255,255,0.35)",
                })
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );

  // helper to check active route when leaving (keeps active background)
  function isActive(path: string) {
    return typeof window !== "undefined" && window.location.pathname === path;
  }
}
