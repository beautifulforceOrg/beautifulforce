import { db } from "@storeforge/db";

export async function getAllProducts() {
  return db.product.findMany({
    orderBy: { createdAt: "asc" },
    include: { images: { orderBy: { position: "asc" } } },
  });
}

export async function getCollectionBySlug(slug: string) {
  return db.collection.findUnique({
    where: { slug },
    include: {
      products: {
        orderBy: { createdAt: "asc" },
        include: { images: { orderBy: { position: "asc" } } },
      },
    },
  });
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { position: "asc" } },
      variants: true,
      collections: true,
    },
  });
}

export function primaryImageUrl(images: { url: string }[]): string | undefined {
  return images[0]?.url;
}
