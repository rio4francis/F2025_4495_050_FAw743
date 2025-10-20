import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-8" role="main">
      <Outlet />
    </div>
  );
}
