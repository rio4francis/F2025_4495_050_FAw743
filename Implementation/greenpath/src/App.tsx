import { NavLink, Outlet, useLocation } from "react-router-dom";
//import ChartFromCsv from "./components/ChartFromCsv";

export default function App() {
  const link = "hover:underline";
  const active = "font-semibold underline";
  const location = useLocation();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-10 bg-white border-b">
        <nav className="max-w-5xl mx-auto flex items-center gap-6 p-4" aria-label="Primary">
          <span className="font-bold text-xl">GreenPath</span>
          <NavLink to="/" end className={({ isActive }) => (isActive ? active : link)}>Home</NavLink>
          <NavLink to="/categories" className={({ isActive }) => (isActive ? active : link)}>Categories</NavLink>
          <NavLink to="/analytics" className={({ isActive }) => (isActive ? active : link)}>Analytics</NavLink>
          <NavLink to="/chat" className={({ isActive }) => (isActive ? active : link)}>Chat</NavLink>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto p-4" role="main">
        {/* Render route content */}
        <Outlet />

       
      </main>

      <footer className="max-w-5xl mx-auto p-4 mt-8 border-t">
        <p className="text-sm">© {new Date().getFullYear()} GreenPath</p>
      </footer>
    </div>
  );
}
