import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@storeforge/ui";
import { primaryImageUrl } from "../lib/catalog";

export function ProductCard({
  product,
}: {
  product: { slug: string; name: string; price: number; images: { url: string }[] };
}) {
  const imageUrl = primaryImageUrl(product.images);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="flex flex-col gap-2 rounded-[var(--sf-radius,0.5rem)] border border-border bg-background p-3 text-foreground transition-shadow hover:shadow-md"
    >
      {imageUrl ? (
        <div className="relative aspect-square w-full overflow-hidden rounded">
          <Image src={imageUrl} alt={product.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
        </div>
      ) : null}
      <span className="font-heading text-base font-medium">{product.name}</span>
      <span className="text-muted">{formatPrice(product.price)}</span>
    </Link>
  );
}

export function ProductGrid({
  products,
}: {
  products: { slug: string; name: string; price: number; images: { url: string }[] }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} />
      ))}
    </div>
  );
}
