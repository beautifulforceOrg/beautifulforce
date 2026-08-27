"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatPrice } from "@storeforge/ui";
import { HeartIcon } from "./icons";

export interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: { url: string }[];
}

function WishlistButton({ productName }: { productName: string }) {
  // Visual only -- there's no wishlist backend in this build. The real
  // site's heart icon is a full feature (a third-party app); reproducing
  // its look without inventing a fake "saved" list keeps this honest.
  const [saved, setSaved] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        setSaved((s) => !s);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow"
    >
      <HeartIcon filled={saved} className="h-4 w-4 text-brand" />
    </button>
  );
}

export function CatalogGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
      {products.map((product) => (
        <div key={product.id} className="relative">
          <WishlistButton productName={product.name} />
          <Link href={`/products/${product.slug}`} className="group block">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--sf-radius,0.5rem)] bg-muted">
              {product.images[0] ? (
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  fill
                  sizes="(min-width: 640px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />
              ) : null}
            </div>
            <span className="mt-3 block text-center text-sm uppercase text-brand">{product.name}</span>
            <span className="mt-1 block text-center text-sm text-foreground">{formatPrice(product.price)}</span>
          </Link>
        </div>
      ))}
    </div>
  );
}
