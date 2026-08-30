import { notFound } from "next/navigation";
import { getCollectionBySlug } from "../../../lib/catalog";
import { ProductGrid } from "../../product-card";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 font-heading text-3xl font-semibold text-foreground">{collection.name}</h1>
      {collection.products.length === 0 ? (
        <p className="text-muted">No products in this collection yet.</p>
      ) : (
        <ProductGrid products={collection.products} />
      )}
    </main>
  );
}
