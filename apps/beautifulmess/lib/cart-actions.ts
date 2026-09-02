"use server";

import { getSessionCustomerId } from "./auth";
import type { CartLine } from "./cart-context";
import { getServerCart, saveServerCart } from "./cart-sync";

/** Used once on mount to merge in a logged-in customer's server-persisted cart. Resolves [] for a guest. */
export async function fetchServerCart(): Promise<CartLine[]> {
  const customerId = await getSessionCustomerId();
  if (!customerId) return [];
  return getServerCart(customerId);
}

/**
 * Best-effort background sync fired on every local cart change -- a
 * no-op for a guest (nothing to sync to). Never awaited by the caller's
 * UI; a failure here just means the next successful sync catches up,
 * it never blocks browsing/checkout.
 */
export async function syncServerCart(lines: CartLine[]): Promise<void> {
  const customerId = await getSessionCustomerId();
  if (!customerId) return;
  await saveServerCart(customerId, lines);
}
