import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCompleteTheLook,
  getProductBySlug,
  getWishlistedProductIds,
  getYouMayAlsoLike,
} from "../../../lib/catalog";
import { getSessionCustomerId } from "../../../lib/auth";
import { isProductInStock } from "../../../lib/inventory";
import { SITE_NAME, SITE_URL } from "../../../lib/site-config";
import { ProductDetail } from "./product-detail";

// Every product previously served the same site-wide title/description
// (app/layout.tsx's static metadata) -- a real SEO gap for a catalog
// site, since neither Google nor a shared social-media link preview
// could distinguish one product from another.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const plainDescription = product.description?.replace(/<[^>]*>/g, "").trim();
  const description = plainDescription
    ? plainDescription.slice(0, 160)
    : `Shop ${product.name} from Beautiful Mess.`;
  const image = product.images[0]?.url;

  return {
    title: `${product.name} | ${SITE_NAME}`,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `/products/${slug}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

// Real per-product structured data for Google's Product rich results
// (price/availability in search) -- previously nothing on this page told
// search engines this was a product at all, just plain HTML.
function productJsonLd(product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description?.replace(/<[^>]*>/g, "").trim() || undefined,
    image: product.images.map((image) => image.url),
    sku: product.sku ?? undefined,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${slug}`,
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability: isProductInStock(product.variants)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, wishlistedIds, customerId] = await Promise.all([
    getProductBySlug(slug),
    getWishlistedProductIds(),
    getSessionCustomerId(),
  ]);
  if (!product) {
    notFound();
  }

  const collectionIds = product.collections.map((c) => c.id);
  const [completeTheLook, youMayAlsoLike] = await Promise.all([
    getCompleteTheLook(product.id, collectionIds),
    getYouMayAlsoLike(product.id, collectionIds),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line no-restricted-syntax -- JSON.stringify of our own server-computed object, never raw user input
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product, slug)) }}
      />
      <ProductDetail
        product={product}
        initialWishlisted={wishlistedIds.includes(product.id)}
        completeTheLook={completeTheLook}
        youMayAlsoLike={youMayAlsoLike}
        hasReviewedAlready={product.reviews.some((review) => review.customerId === customerId)}
      />
    </>
  );
}
