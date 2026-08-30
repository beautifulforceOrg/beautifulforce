// Mirrors packages/ui/src/lib/format-price.ts exactly -- duplicated
// rather than imported cross-package (ui-native shouldn't depend on the
// web-only ui package just for one pure function). Keep these two in
// sync if pricing display rules ever change; a shared home for this
// (e.g. promoted to packages/config) is a reasonable future move once a
// second pure function needs the same treatment.
export function formatPrice(paise: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
