"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartLine {
  productId: string;
  variantId?: string;
  name: string;
  variantLabel?: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (line: Omit<CartLine, "quantity">) => void;
  increment: (productId: string, variantId?: string) => void;
  decrement: (productId: string, variantId?: string) => void;
  remove: (productId: string, variantId?: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "beautifulsilver-cart";

function sameLine(a: { productId: string; variantId?: string }, b: { productId: string; variantId?: string }) {
  return a.productId === b.productId && a.variantId === b.variantId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) setLines(JSON.parse(stored) as CartLine[]);
    } catch {
      // localStorage unavailable (private browsing, etc.) -- start empty.
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

  function addItem(line: Omit<CartLine, "quantity">) {
    setLines((prev) => {
      const existing = prev.find((candidate) => sameLine(candidate, line));
      if (existing) {
        return prev.map((candidate) =>
          sameLine(candidate, line) ? { ...candidate, quantity: candidate.quantity + 1 } : candidate
        );
      }
      return [...prev, { ...line, quantity: 1 }];
    });
  }

  function increment(productId: string, variantId?: string) {
    setLines((prev) =>
      prev.map((line) => (sameLine(line, { productId, variantId }) ? { ...line, quantity: line.quantity + 1 } : line))
    );
  }

  function decrement(productId: string, variantId?: string) {
    setLines((prev) =>
      prev
        .map((line) => (sameLine(line, { productId, variantId }) ? { ...line, quantity: line.quantity - 1 } : line))
        .filter((line) => line.quantity > 0)
    );
  }

  function remove(productId: string, variantId?: string) {
    setLines((prev) => prev.filter((line) => !sameLine(line, { productId, variantId })));
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
