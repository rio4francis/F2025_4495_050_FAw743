import { useMemo, useState } from "react";
import { CATEGORIES } from "../data/categories";
import CategoryCard from "../components/CategoryCard";

export default function Categories() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const norm = q.trim().toLowerCase();
    if (!norm) return CATEGORIES;
    return CATEGORIES.filter(c =>
      c.name.toLowerCase().includes(norm) ||
      c.description.toLowerCase().includes(norm)
    );
  }, [q]);

  return (
    <section aria-labelledby="categories-heading">
      <h1 id="categories-heading" className="text-2xl font-semibold mb-4">
        Sustainable Product Categories
      </h1>

      <label htmlFor="search" className="block text-sm font-medium mb-1">
        Search categories
      </label>
      <input
        id="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full md:w-96 border rounded-md px-3 py-2 mb-4"
        placeholder="Search…"
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {filtered.map((c) => (
          <CategoryCard key={c.id} {...c} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p role="status" className="text-gray-600 mt-4">No results.</p>
      )}
    </section>
  );
}
