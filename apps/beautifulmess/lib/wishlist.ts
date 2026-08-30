import { db } from "@storeforge/db";

// The customerId-taking core of wishlist read/write, shared by the
// cookie-authenticated web path (lib/catalog.ts, lib/account-actions.ts)
// and the Bearer-token-authenticated mobile path
// (app/api/mobile/wishlist/route.ts) -- one business-logic function, two
// transport wrappers, same as the catalog endpoints in Phase 2.

export async function getWishlistedProductIdsFor(customerId: string): Promise<string[]> {
  const items = await db.wishlistItem.findMany({ where: { customerId }, select: { productId: true } });
  return items.map((item) => item.productId);
}

export async function toggleWishlistFor(customerId: string, productId: string): Promise<{ wishlisted: boolean }> {
  const existing = await db.wishlistItem.findUnique({
    where: { customerId_productId: { customerId, productId } },
  });

  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    return { wishlisted: false };
  }

  await db.wishlistItem.create({ data: { customerId, productId } });
  return { wishlisted: true };
}
