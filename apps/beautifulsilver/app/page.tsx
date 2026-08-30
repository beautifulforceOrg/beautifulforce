import { getAllProducts } from "../lib/catalog";
import { ProductGrid } from "./product-card";

// Without a dynamic API in this route, Next tries to statically prerender
// "/" at build time -- which would require a real DATABASE_URL available
// to `next build` itself, not just to `next dev`/tests (apps/_template's
// own home page has this same latent issue, reproduced while building this
// app). Render on demand instead, since the catalog is live data anyway.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getAllProducts();

  return (
    <main className="mx-auto max-w-5xl p-8">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-4xl font-semibold text-foreground">Beautiful Silver</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted">
          Handcrafted sterling silver jewellery, made to be worn every day and kept for years -- rings,
          chains, earrings, bangles, and anklets.
        </p>
      </div>
      <h2 className="mb-4 font-heading text-2xl font-medium text-foreground">All jewellery</h2>
      <ProductGrid products={products} />
    </main>
  );
}
