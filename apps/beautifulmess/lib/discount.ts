// The real site's own active discount (data/shopify-export/discounts_export_1.csv:
// MESS05, -5% order discount). Not wired into a discounts table since
// there's exactly one real code and no admin UI to manage more yet --
// see CLAUDE.md's scope rule on not building for hypothetical future needs.
const DISCOUNT_CODES: Record<string, number> = {
  MESS05: 0.05,
};

export interface DiscountResult {
  valid: boolean;
  code: string;
  percentOff: number;
  amountOff: number;
}

export function applyDiscountCode(code: string, subtotal: number): DiscountResult {
  const normalized = code.trim().toUpperCase();
  const percentOff = DISCOUNT_CODES[normalized];
  if (!percentOff) {
    return { valid: false, code: normalized, percentOff: 0, amountOff: 0 };
  }
  return {
    valid: true,
    code: normalized,
    percentOff,
    amountOff: Math.round(subtotal * percentOff),
  };
}
