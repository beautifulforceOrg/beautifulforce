export interface CartLineInput {
  price: number;
  qty: number;
}

export function calculateCartTotal(items: CartLineInput[]): number {
  return items.reduce((total, item) => total + item.price * item.qty, 0);
}
