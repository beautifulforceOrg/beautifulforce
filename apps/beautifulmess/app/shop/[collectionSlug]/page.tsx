import { notFound } from "next/navigation";
import { getCollectionBySlug } from "../../../lib/catalog";
import { CatalogGrid } from "../../catalog-grid";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ collectionSlug: string }>;
}) {
  const { collectionSlug } = await params;
  const collection = await getCollectionBySlug(collectionSlug);
  if (!collection) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-heading mb-8 text-3xl uppercase text-foreground">{collection.name}</h1>
      {collection.products.length === 0 ? (
        <p className="text-muted">No products in this collection yet.</p>
      ) : (
        <CatalogGrid products={collection.products} />
      )}
    </main>
  );
}
