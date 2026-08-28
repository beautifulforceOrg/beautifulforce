"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button, VariantPicker, formatPrice } from "@storeforge/ui";
import { HeartIcon } from "../../icons";
import { toggleWishlist } from "../../../lib/account-actions";
import { WHATSAPP_URL } from "../../../lib/site-constants";
import { useCart } from "../../../lib/cart-context";
import { isVariantInStock } from "../../../lib/inventory";
import { ReviewsSection, type ReviewItem } from "./reviews-section";

interface Variant {
  id: string;
  name: string;
  value: string;
  stockQty: number | null;
}

interface RelatedProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  images: { url: string }[];
}

interface ProductWithDetails {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  images: { url: string }[];
  variants: Variant[];
  reviews: ReviewItem[];
}

function RelatedProductCard({ product }: { product: RelatedProduct }) {
  return (
    <Link href={`/products/${product.slug}`} className="block w-40 flex-shrink-0">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--sf-radius,0.5rem)] bg-muted">
        {product.images[0] ? (
          <Image src={product.images[0].url} alt={product.name} fill sizes="160px" className="object-cover" />
        ) : null}
      </div>
      <span className="mt-2 block text-center text-xs uppercase text-brand">{product.name}</span>
      <span className="block text-center text-xs text-foreground">{formatPrice(product.price)}</span>
    </Link>
  );
}

export function ProductDetail({
  product,
  initialWishlisted,
  completeTheLook,
  youMayAlsoLike,
  hasReviewedAlready,
}: {
  product: ProductWithDetails;
  initialWishlisted: boolean;
  completeTheLook: RelatedProduct | null;
  youMayAlsoLike: RelatedProduct[];
  hasReviewedAlready: boolean;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants[0]?.id ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [wishlistPending, setWishlistPending] = useState(false);

  async function handleToggleWishlist() {
    if (wishlistPending) return;
    setWishlistPending(true);
    const result = await toggleWishlist(product.id);
    setWishlistPending(false);
    if (result.requiresLogin) {
      router.push("/account/login");
      return;
    }
    setWishlisted(result.wishlisted);
  }

  const variantGroupName = product.variants[0]?.name ?? null;
  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
  const isGiftCard = product.slug === "bm-gift-card";
  const [isGift, setIsGift] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const selectedOutOfStock = selectedVariant ? !isVariantInStock(selectedVariant.stockQty) : false;
  const giftEmailMissing = isGiftCard && isGift && recipientEmail.trim() === "";
  const canAddToCart = !selectedOutOfStock && !giftEmailMissing;

  function addToCart() {
    for (let i = 0; i < quantity; i += 1) {
      addItem({
        productId: product.id,
        variantId: selectedVariant?.id,
        variantLabel: selectedVariant?.value,
        name: product.name,
        price: product.price,
        giftRecipientEmail: isGiftCard && isGift ? recipientEmail.trim() : undefined,
        giftRecipientName: isGiftCard && isGift ? recipientName.trim() || undefined : undefined,
        giftMessage: isGiftCard && isGift ? giftMessage.trim() || undefined : undefined,
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
    <>
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
            onClick={handleToggleWishlist}
            aria-pressed={wishlisted}
            className="flex items-center gap-2 rounded-[var(--sf-radius,0.5rem)] border border-brand px-4 py-2 text-sm text-brand disabled:opacity-50"
            disabled={wishlistPending}
          >
            <HeartIcon filled={wishlisted} className="h-4 w-4" />
            {wishlisted ? "Added to wishlist" : "Add to wishlist"}
          </button>

          <h1 className="font-heading mt-4 text-3xl uppercase text-foreground">{product.name}</h1>
          <p className="mt-2 text-lg text-foreground">{formatPrice(product.price)}</p>
          <p className="text-xs text-muted">Taxes included. Shipping calculated at checkout.</p>

          {product.variants.length > 0 && variantGroupName ? (
            <div className="mt-6">
              <VariantPicker
                label={variantGroupName}
                options={product.variants.map((variant) => ({
                  id: variant.id,
                  value: variant.value,
                  available: isVariantInStock(variant.stockQty),
                }))}
                selectedId={selectedVariantId}
                onSelect={(id) => {
                  setSelectedVariantId(id);
                  setAdded(false);
                }}
              />
              {selectedOutOfStock ? (
                <p className="mt-2 text-xs font-medium uppercase text-foreground">Sold out in this size</p>
              ) : null}
            </div>
          ) : null}

          {isGiftCard ? (
            <div className="mt-6 border-t border-border pt-4">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} />
                Send to a friend
              </label>
              {isGift ? (
                <div className="mt-3 space-y-3">
                  <div>
                    <label htmlFor="gift-recipient-email" className="mb-1 block text-xs uppercase text-muted">
                      Recipient&apos;s email
                    </label>
                    <input
                      id="gift-recipient-email"
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm text-foreground outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="gift-recipient-name" className="mb-1 block text-xs uppercase text-muted">
                      Recipient name (optional)
                    </label>
                    <input
                      id="gift-recipient-name"
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm text-foreground outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="gift-message" className="mb-1 block text-xs uppercase text-muted">
                      Message (optional)
                    </label>
                    <textarea
                      id="gift-message"
                      rows={2}
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-3 py-2 text-sm text-foreground outline-none"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Real, site-wide notice -- every dress's size chart differs, so
              customers are asked to confirm fit over WhatsApp before
              ordering, given the no-return/no-refund policy. */}
          <p className="mt-4 text-xs font-medium uppercase text-foreground">
            Important notice: every dress has different sizing. Kindly confirm the size on WhatsApp before
            confirming your order, as we have no return or refund.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block rounded-[var(--sf-radius,0.5rem)] bg-brand px-4 py-2 text-xs font-medium uppercase text-brand-foreground"
          >
            Please read before confirming order
          </a>

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
            <Button onClick={handleAddToCart} disabled={!canAddToCart} className="flex-1">
              {selectedOutOfStock ? "Sold out" : added ? "Added to cart" : "Add to cart"}
            </Button>
          </div>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!canAddToCart}
            className="mt-3 w-full rounded-[var(--sf-radius,0.5rem)] bg-brand py-2.5 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
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

          <details className="group border-t border-border pt-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium uppercase text-foreground">
              Shipping
              <span className="text-brand transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-muted">
              Standard delivery: 15&ndash;18 days, ₹299 flat shipping across India. See our{" "}
              <Link href="/policies/shipping" className="text-brand underline">
                Shipping Policy
              </Link>{" "}
              for express rates and international shipping.
            </p>
          </details>

          <details className="group border-t border-border pt-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium uppercase text-foreground">
              More Information
              <span className="text-brand transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-muted">
              Recommended to dry clean for the first time at least, followed by regular machine wash at
              home. Color variations between product images and the actual item may occur due to
              differences between screens.
            </p>
          </details>

          <details className="group border-t border-border pt-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium uppercase text-foreground">
              Size Chart
              <span className="text-brand transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-muted">
              Every dress has a different size chart. Rather than a single generic chart, please confirm
              your child&apos;s measurements against this specific style on{" "}
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-brand underline">
                WhatsApp
              </a>{" "}
              before ordering -- we have no return or refund once an order is placed.
            </p>
          </details>

          {completeTheLook ? (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="font-heading mb-4 text-lg uppercase text-foreground">Complete the Look</h2>
              <RelatedProductCard product={completeTheLook} />
            </div>
          ) : null}
        </div>
      </main>

      {youMayAlsoLike.length > 0 ? (
        <section aria-label="You may also like" className="bg-brand py-16 text-brand-foreground">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="font-heading mb-8 text-center text-2xl uppercase">You May Also Like</h2>
            <div className="flex justify-center gap-4 overflow-x-auto">
              {youMayAlsoLike.map((related) => (
                <div key={related.id} className="rounded-[var(--sf-radius,0.5rem)] bg-background p-3">
                  <RelatedProductCard product={related} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <ReviewsSection
        productId={product.id}
        productSlug={product.slug}
        reviews={product.reviews}
        hasReviewedAlready={hasReviewedAlready}
      />
    </>
  );
}
