import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@storeforge/ui";

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: { url: string }[];
}

export function CatalogGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.slug}`}
          className="flex flex-col gap-2 rounded-[var(--sf-radius,0.5rem)] border border-border bg-background p-3 text-foreground transition-transform hover:-translate-y-0.5"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded">
            {product.images[0] ? (
              <Image
                src={product.images[0].url}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>
          <span className="text-sm font-medium uppercase">{product.name}</span>
          <span className="text-sm text-muted">{formatPrice(product.price)}</span>
        </Link>
      ))}
    </div>
  );
}
