// stockQty of null means untracked/unlimited (the real inventory export
// only lists sizes Shopify has ever tracked stock for); 0 means sold out.
export function isVariantInStock(stockQty: number | null | undefined): boolean {
  return stockQty === null || stockQty === undefined || stockQty > 0;
}

export function isProductInStock(variants: { stockQty: number | null }[]): boolean {
  if (variants.length === 0) return true;
  return variants.some((variant) => isVariantInStock(variant.stockQty));
}
