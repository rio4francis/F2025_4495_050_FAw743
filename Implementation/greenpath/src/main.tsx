// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./index.css";
import RootLayout from "./layout/RootLayout";

import Home from "./pages/Home";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail";
import Analytics from "./pages/Analytics";
import AnalyticsML from "./pages/AnalyticsML";
import Chat from "./pages/Chat";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "categories", element: <Categories /> },
      { path: "categories/:id", element: <CategoryDetail /> },
      { path: "analytics", element: <Analytics /> },

      // NEW: Top-level ML Analytics page
      { path: "analyticsml", element: <AnalyticsML /> },

      // Legacy redirect from the old nested path to the new top-level route
      { path: "analytics/ml", element: <Navigate to="/analyticsml" replace /> },

      { path: "chat", element: <Chat /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
