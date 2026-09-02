import type { CartLine } from "./cart-context";

// Deliberately zero imports beyond a type-only one -- lib/cart-context.tsx
// (a "use client" file) needs this, and importing anything that touches
// @storeforge/db (e.g. lib/cart-sync.ts) from client code would bundle
// Prisma's client into the browser build.
export function mergeCartLines(a: CartLine[], b: CartLine[]): CartLine[] {
  const merged = [...a];
  for (const line of b) {
    const existing = merged.find((l) => l.productId === line.productId);
    if (existing) {
      existing.quantity += line.quantity;
    } else {
      merged.push(line);
    }
  }
  return merged;
}
