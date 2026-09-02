import Link from "next/link";
import { getCollections } from "../../lib/catalog";

export default async function ShopIndexPage() {
  const collections = await getCollections();

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-heading mb-8 text-3xl text-foreground">Shop</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {collections.map((collection) => (
          <Link
            key={collection.id}
            href={`/shop/${collection.slug}`}
            className="rounded-[var(--sf-radius,0.5rem)] border border-border bg-background p-8 text-center font-heading text-xl uppercase text-foreground hover:bg-muted"
          >
            {collection.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
