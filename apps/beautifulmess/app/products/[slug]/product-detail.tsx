"use client";

import Image from "next/image";
import { useState } from "react";
import { Button, VariantPicker, formatPrice } from "@storeforge/ui";
import { useCart } from "../../../lib/cart-context";

interface Variant {
  id: string;
  name: string;
  value: string;
}

interface ProductWithDetails {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  images: { url: string }[];
  variants: Variant[];
}

export function ProductDetail({ product }: { product: ProductWithDetails }) {
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants[0]?.id ?? null
  );
  const [added, setAdded] = useState(false);

  const variantGroupName = product.variants[0]?.name ?? null;
  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);

  function handleAddToCart() {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      variantLabel: selectedVariant?.value,
      name: product.name,
      price: product.price,
    });
    setAdded(true);
  }

  return (
    <main className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-2">
      <div>
        <div className="relative aspect-square w-full overflow-hidden rounded-[var(--sf-radius,0.5rem)] bg-muted">
          {product.images[activeImage] ? (
            <Image
              src={product.images[activeImage]!.url}
              alt={product.name}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          ) : null}
        </div>
        {product.images.length > 1 ? (
          <div className="mt-3 flex gap-2">
            {product.images.map((image, index) => (
              <button
                key={image.url}
                type="button"
                aria-label={`Show image ${index + 1} of ${product.name}`}
                aria-pressed={index === activeImage}
                onClick={() => setActiveImage(index)}
                className={`relative h-16 w-16 overflow-hidden rounded border ${
                  index === activeImage ? "border-brand" : "border-border"
                }`}
              >
                <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div>
        <h1 className="font-heading text-3xl uppercase text-foreground">{product.name}</h1>
        <p className="mt-2 text-lg text-muted">{formatPrice(product.price)}</p>

        {product.description ? (
          // Trusted, first-party content from this client's own catalog
          // export (data/shopify-export/products_export_1.csv), not user
          // input -- verified free of <script> tags before this was wired
          // up. See CLAUDE.md's rule on dangerouslySetInnerHTML.
          <div
            className="mt-4 max-w-none text-sm leading-relaxed text-foreground"
            // eslint-disable-next-line no-restricted-syntax -- see comment above; reviewed, trusted first-party content
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        ) : null}

        {product.variants.length > 0 && variantGroupName ? (
          <div className="mt-6">
            <VariantPicker
              label={variantGroupName}
              options={product.variants.map((variant) => ({ id: variant.id, value: variant.value }))}
              selectedId={selectedVariantId}
              onSelect={(id) => {
                setSelectedVariantId(id);
                setAdded(false);
              }}
            />
          </div>
        ) : null}

        <Button onClick={handleAddToCart} className="mt-6">
          {added ? "Added to cart" : "Add to cart"}
        </Button>
      </div>
    </main>
  );
}
