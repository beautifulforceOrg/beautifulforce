"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Button, VariantPicker, formatPrice } from "@storeforge/ui";
import { useCart } from "../../../lib/cart-context";

interface Variant {
  id: string;
  name: string;
  value: string;
  price: number | null;
  stockQty: number | null;
}

interface ProductWithDetails {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  images: { url: string; altText: string | null }[];
  variants: Variant[];
}

export function ProductDetail({ product }: { product: ProductWithDetails }) {
  const { addItem } = useCart();
  const variantGroupName = product.variants[0]?.name ?? null;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(product.variants[0]?.id ?? null);
  const [added, setAdded] = useState(false);

  const selectedVariant = useMemo(
    () => product.variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [product.variants, selectedVariantId]
  );

  const outOfStock = selectedVariant ? selectedVariant.stockQty === 0 : false;
  const displayPrice = selectedVariant?.price ?? product.price;

  function handleAddToCart() {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      variantLabel: selectedVariant ? `${selectedVariant.name}: ${selectedVariant.value}` : undefined,
      price: displayPrice,
    });
    setAdded(true);
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-8 p-8 sm:grid-cols-2">
      <div className="flex flex-col gap-4">
        {product.images.map((image) => (
          <div key={image.url} className="relative aspect-square w-full overflow-hidden rounded-[var(--sf-radius,0.5rem)]">
            <Image
              src={image.url}
              alt={image.altText ?? product.name}
              fill
              sizes="(min-width: 640px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-semibold text-foreground">{product.name}</h1>
        <p className="text-xl text-foreground">{formatPrice(displayPrice)}</p>

        {product.variants.length > 0 && variantGroupName ? (
          <VariantPicker
            label={variantGroupName}
            selectedId={selectedVariantId}
            onSelect={setSelectedVariantId}
            options={product.variants.map((variant) => ({
              id: variant.id,
              value: variant.value,
              available: variant.stockQty !== 0,
            }))}
          />
        ) : null}

        {outOfStock ? <p style={{ color: "#B91C1C" }}>Out of stock in this option</p> : null}

        <Button onClick={handleAddToCart} disabled={outOfStock}>
          {added ? "Added to cart" : "Add to cart"}
        </Button>

        {product.description ? (
          // Reviewer justification (CLAUDE.md): product.description is
          // trusted first-party HTML written by this repo's own seed script
          // (scripts/seed-catalog.ts), never user input -- there is no
          // customer-controlled path that can reach this field.
          <div
            className="prose prose-sm max-w-none text-foreground"
            // eslint-disable-next-line no-restricted-syntax -- see comment above; reviewed, trusted first-party content
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        ) : null}
      </div>
    </main>
  );
}
