import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import RootLayout from "./layout/RootLayout"; // <-- singular 'layout'
import App from "./App";
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import Analytics from "./pages/Analytics";
import Chat from "./pages/Chat";





const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "categories", element: <Categories /> },
      { path: "analytics", element: <Analytics /> },
      { path: "chat", element: <Chat /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
