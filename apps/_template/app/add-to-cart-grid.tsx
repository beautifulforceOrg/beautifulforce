"use client";

import { ProductGrid, type Product } from "@storeforge/ui";
import { useCart } from "../lib/cart-context";

export function AddToCartGrid({ products }: { products: Product[] }) {
  const { addItem } = useCart();

  return (
    <ProductGrid
      products={products}
      onAddToCart={(productId) => {
        const product = products.find((candidate) => candidate.id === productId);
        if (product) {
          addItem(product);
        }
      }}
    />
  );
}
