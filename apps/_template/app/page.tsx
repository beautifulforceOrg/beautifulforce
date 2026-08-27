import { db } from "@storeforge/db";
import { AddToCartGrid } from "./add-to-cart-grid";

export default async function HomePage() {
  const products = await db.product.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Storeforge reference storefront</h1>
      <AddToCartGrid products={products} />
    </main>
  );
}
