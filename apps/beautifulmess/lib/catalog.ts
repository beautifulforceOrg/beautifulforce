import { db } from "@storeforge/db";
import { getSessionCustomerId } from "./auth";

export async function getWishlistedProductIds(): Promise<string[]> {
  const customerId = await getSessionCustomerId();
  if (!customerId) return [];
  const items = await db.wishlistItem.findMany({ where: { customerId }, select: { productId: true } });
  return items.map((item) => item.productId);
}

export async function getCollections() {
  return db.collection.findMany({ orderBy: { name: "asc" } });
}

export async function getCollectionBySlug(slug: string) {
  return db.collection.findUnique({
    where: { slug },
    include: {
      products: {
        include: { images: { orderBy: { position: "asc" }, take: 1 } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getFeaturedProducts(limit = 8) {
  return db.product.findMany({
    take: limit,
    orderBy: { createdAt: "asc" },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: true,
    },
  });
}
