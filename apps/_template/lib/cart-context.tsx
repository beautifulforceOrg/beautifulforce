"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (product: { id: string; name: string; price: number }) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "storeforge-template-cart";

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

  function addItem(product: { id: string; name: string; price: number }) {
    setLines((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        return prev.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
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
