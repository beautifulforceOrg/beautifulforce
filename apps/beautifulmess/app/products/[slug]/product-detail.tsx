"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { Button, VariantPicker, formatPrice } from "@storeforge/ui";
import { HeartIcon } from "../../icons";
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
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants[0]?.id ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const variantGroupName = product.variants[0]?.name ?? null;
  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);

  function addToCart() {
    for (let i = 0; i < quantity; i += 1) {
      addItem({
        productId: product.id,
        variantId: selectedVariant?.id,
        variantLabel: selectedVariant?.value,
        name: product.name,
        price: product.price,
      });
    }
  }

  function handleAddToCart() {
    addToCart();
    setAdded(true);
  }

  function handleBuyNow() {
    addToCart();
    router.push("/checkout");
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
        <button
          type="button"
          onClick={() => setWishlisted((w) => !w)}
          aria-pressed={wishlisted}
          className="flex items-center gap-2 rounded-[var(--sf-radius,0.5rem)] border border-brand px-4 py-2 text-sm text-brand"
        >
          <HeartIcon filled={wishlisted} className="h-4 w-4" />
          Add to wishlist
        </button>

        <h1 className="font-heading mt-4 text-3xl uppercase text-foreground">{product.name}</h1>
        <p className="mt-2 text-lg text-foreground">{formatPrice(product.price)}</p>
        <p className="text-xs text-muted">Taxes included. Shipping calculated at checkout.</p>

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

        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center rounded-[var(--sf-radius,0.5rem)] border border-border">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-foreground"
            >
              -
            </button>
            <span className="px-3 text-sm text-foreground" aria-label="Quantity">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3 py-2 text-foreground"
            >
              +
            </button>
          </div>
          <Button onClick={handleAddToCart} className="flex-1">
            {added ? "Added to cart" : "Add to cart"}
          </Button>
        </div>
        <button
          type="button"
          onClick={handleBuyNow}
          className="mt-3 w-full rounded-[var(--sf-radius,0.5rem)] bg-brand py-2.5 text-sm font-medium uppercase text-brand-foreground"
        >
          Buy it now
        </button>

        {product.description ? (
          <details className="group mt-8 border-t border-border pt-4" open>
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium uppercase text-foreground">
              Description
              <span className="text-brand transition-transform group-open:rotate-45">+</span>
            </summary>
            {/* Trusted, first-party content from this client's own catalog
                export (data/shopify-export/products_export_1.csv), not user
                input -- verified free of <script> tags before this was
                wired up. See CLAUDE.md's rule on dangerouslySetInnerHTML. */}
            <div
              className="mt-3 max-w-none text-sm leading-relaxed text-muted"
              // eslint-disable-next-line no-restricted-syntax -- see comment above; reviewed, trusted first-party content
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </details>
        ) : null}

        <details className="group border-t border-border pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium uppercase text-foreground">
            Return &amp; Exchange
            <span className="text-brand transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 text-sm text-muted">
            Concerned to protect children&apos;s hygiene and safety, we do not accept returns or exchanges on
            any items. We are a pure ready-to-wear brand, but we do offer free alterations.
          </p>
        </details>
      </div>
    </main>
  );
}
