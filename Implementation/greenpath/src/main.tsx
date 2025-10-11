// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import RootLayout from "./layout/RootLayout";

import Home from "./pages/Home";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail"; // NEW: detail page
import Analytics from "./pages/Analytics";
import Chat from "./pages/Chat";
import AnalyticsML from "./pages/AnalyticsML";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "categories", element: <Categories /> },
      { path: "categories/:id", element: <CategoryDetail /> }, // NEW: dynamic category route
      { path: "analytics", element: <Analytics /> },
      { path: "analytics/ml", element: <AnalyticsML />},
      { path: "chat", element: <Chat /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
