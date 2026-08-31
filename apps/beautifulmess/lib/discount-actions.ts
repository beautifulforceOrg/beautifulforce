"use server";

import { applyDiscountCode, type DiscountResult } from "./discount";

// The checkout page's "Apply" button needs a live preview of a discount
// code before placing the order -- applyDiscountCode is DB-backed
// (async), so it needs a Server Action wrapper to be callable from a
// client component. lib/checkout.ts calls applyDiscountCode directly
// server-side at order-placement time; this is only for the preview.
export async function previewDiscountCode(code: string, subtotal: number): Promise<DiscountResult> {
  return applyDiscountCode(code, subtotal);
}
