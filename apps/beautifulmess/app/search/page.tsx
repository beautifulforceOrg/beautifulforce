import { searchProducts, getWishlistedProductIds } from "../../lib/catalog";
import { CatalogGrid } from "../catalog-grid";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const [products, wishlistedIds] = await Promise.all([searchProducts(q), getWishlistedProductIds()]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-heading mb-8 text-3xl text-foreground">Search</h1>
      <form action="/search" method="get" className="mb-10 max-w-md">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search products"
          aria-label="Search products"
          className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border bg-background px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
        />
      </form>
      {q.trim() === "" ? (
        <p className="text-muted">Type a product name above to search.</p>
      ) : products.length === 0 ? (
        <p className="text-muted">No products found for &ldquo;{q}&rdquo;.</p>
      ) : (
        <CatalogGrid products={products} wishlistedIds={wishlistedIds} />
      )}
    </main>
  );
}
