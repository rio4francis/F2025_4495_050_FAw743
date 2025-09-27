import type { Category } from "../data/categories";

export default function CategoryCard({ name, description }: Category) {
  return (
    <article
      className="rounded-xl border p-4 shadow-sm transition hover:shadow-md focus-within:ring-2"
      tabIndex={0}
      aria-label={name}
    >
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-sm text-gray-700 mt-1">{description}</p>
    </article>
  );
}
