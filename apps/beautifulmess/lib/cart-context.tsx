"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Keyed by productId only, matching @storeforge/ui's CartSummary/CartItem
// (which key their onIncrement/onDecrement/onRemove callbacks by
// productId). Adding an item with a different variant updates the
// existing line's variant rather than creating a second line -- this
// catalog's variants are just a size pick, and one line per product in
// the cart keeps it compatible with the shared cart components as-is.
export interface CartLine {
  productId: string;
  variantId?: string;
  variantLabel?: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (line: Omit<CartLine, "quantity">) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "beautifulmess-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setLines(JSON.parse(stored) as CartLine[]);
    } catch {
      // localStorage unavailable -- start empty.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore -- cart just won't persist across reloads
    }
  }, [lines, hydrated]);

  function addItem(item: Omit<CartLine, "quantity">) {
    setLines((prev) => {
      const existing = prev.find((line) => line.productId === item.productId);
      if (existing) {
        return prev.map((line) =>
          line.productId === item.productId
            ? { ...line, variantId: item.variantId, variantLabel: item.variantLabel, quantity: line.quantity + 1 }
            : line
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function increment(productId: string) {
    setLines((prev) =>
      prev.map((line) => (line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line))
    );
  }

  function decrement(productId: string) {
    setLines((prev) =>
      prev
        .map((line) => (line.productId === productId ? { ...line, quantity: line.quantity - 1 } : line))
        .filter((line) => line.quantity > 0)
    );
  }

  function remove(productId: string) {
    setLines((prev) => prev.filter((line) => line.productId !== productId));
  }

  function clear() {
    setLines([]);
  }

  return (
    <CartContext.Provider value={{ lines, addItem, increment, decrement, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
