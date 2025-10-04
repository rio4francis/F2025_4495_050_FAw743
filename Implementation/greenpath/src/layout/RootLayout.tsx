import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

export default function RootLayout() {
  // green/white base across pages
  const wrapper: React.CSSProperties = {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #e8f5ed 0%, #ffffff 35%, #e8f5ed 100%)", // soft green + white
  };

  const main: React.CSSProperties = {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 16px",
  };

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.96)",
    borderRadius: "18px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    padding: "24px",
  };

  return (
    <div style={wrapper}>
      <Navbar />
      <main style={main}>
        <div style={card}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
