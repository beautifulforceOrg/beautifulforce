// UI-only display formatting -- pricing math itself lives in packages/payments
// so it's tested once there. This never rounds or sums; it only renders.
export function formatPrice(paise: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
