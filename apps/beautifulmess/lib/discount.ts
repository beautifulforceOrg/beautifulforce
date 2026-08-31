import { db } from "@storeforge/db";

export interface DiscountResult {
  valid: boolean;
  code: string;
  percentOff: number; // fraction, e.g. 0.05 for 5% -- DiscountCode.percentOff is a whole percent (5)
  amountOff: number;
}

export async function applyDiscountCode(code: string, subtotal: number): Promise<DiscountResult> {
  const normalized = code.trim().toUpperCase();
  const discount = await db.discountCode.findUnique({ where: { code: normalized, active: true } });
  if (!discount) {
    return { valid: false, code: normalized, percentOff: 0, amountOff: 0 };
  }
  const percentOff = discount.percentOff / 100;
  return {
    valid: true,
    code: normalized,
    percentOff,
    amountOff: Math.round(subtotal * percentOff),
  };
}
