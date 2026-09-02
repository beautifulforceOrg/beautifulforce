import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollectionBySlug, getWishlistedProductIds } from "../../../lib/catalog";
import { filterAndSortProducts } from "../../../lib/product-list";
import { CatalogGrid } from "../../catalog-grid";
import { SortFilterBar } from "./sort-filter-bar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collectionSlug: string }>;
}): Promise<Metadata> {
  const { collectionSlug } = await params;
  const collection = await getCollectionBySlug(collectionSlug);
  if (!collection) return {};

  return {
    title: `${collection.name} | Beautiful Mess`,
    description: `Shop ${collection.name} from Beautiful Mess -- playful, elegant kidswear and accessories.`,
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ collectionSlug: string }>;
  searchParams: Promise<{ sort?: string; availability?: string; minPrice?: string; maxPrice?: string }>;
}) {
  const { collectionSlug } = await params;
  const query = await searchParams;
  const [collection, wishlistedIds] = await Promise.all([
    getCollectionBySlug(collectionSlug),
    getWishlistedProductIds(),
  ]);
  if (!collection) {
    notFound();
  }

  // Prices are stored in paise; the UI's Min/Max inputs are in rupees.
  const products = filterAndSortProducts(collection.products, {
    sort: query.sort,
    availability: query.availability === "in-stock" || query.availability === "out-of-stock" ? query.availability : undefined,
    minPrice: query.minPrice ? Number(query.minPrice) * 100 : undefined,
    maxPrice: query.maxPrice ? Number(query.maxPrice) * 100 : undefined,
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-heading mb-8 text-3xl text-foreground">{collection.name}</h1>
      {collection.products.length === 0 ? (
        <p className="text-muted">No products in this collection yet.</p>
      ) : (
        <>
          <SortFilterBar count={products.length} />
          {products.length === 0 ? (
            <p className="text-muted">No products match these filters.</p>
          ) : (
            <CatalogGrid products={products} wishlistedIds={wishlistedIds} />
          )}
        </>
      )}
    </main>
  );
}
