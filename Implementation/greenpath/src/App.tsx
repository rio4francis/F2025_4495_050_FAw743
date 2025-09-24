import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-10 bg-white border-b">
        <nav className="max-w-5xl mx-auto flex items-center gap-6 p-4" aria-label="Primary">
          <span className="font-bold text-xl">GreenPath</span>
          <a className="hover:underline" href="#">Home</a>
          <a className="hover:underline" href="#">Categories</a>
          <a className="hover:underline" href="#">Analytics</a>
          <a className="hover:underline" href="#">Chat</a>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto p-4" role="main">
        <h1 className="text-2xl font-semibold mb-2">Tailwind Test</h1>
        <p className="text-gray-700 mb-4">If this looks nicely styled, Tailwind is working.</p>
        <button
          className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => setCount((c) => c + 1)}
        >
          You clicked {count} times
        </button>
      </main>

      <footer className="max-w-5xl mx-auto p-4 mt-8 border-t">
        <p className="text-sm">© {new Date().getFullYear()} GreenPath</p>
      </footer>
    </div>
  );
}
