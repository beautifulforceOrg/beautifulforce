import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Mirrors apps/beautifulmess/lib/cart-context.tsx's CartLine/CartProvider
// shape exactly (same field names, same increment/decrement/remove/clear
// semantics) so a future shared cart-summary component could consume
// either -- AsyncStorage stands in for localStorage as the only real
// difference.
export interface CartLine {
  productId: string;
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
const STORAGE_KEY = "storeforge_mobile_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setLines(JSON.parse(stored) as CartLine[]);
      })
      .catch(() => {
        // Storage unavailable -- start empty.
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lines)).catch(() => {
      // ignore -- cart just won't persist across restarts
    });
  }, [lines, hydrated]);

  function addItem(item: Omit<CartLine, "quantity">) {
    setLines((prev) => {
      const existing = prev.find((line) => line.productId === item.productId);
      if (existing) {
        return prev.map((line) => (line.productId === item.productId ? { ...line, quantity: line.quantity + 1 } : line));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function increment(productId: string) {
    setLines((prev) => prev.map((line) => (line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line)));
  }

  function decrement(productId: string) {
    setLines((prev) =>
      prev.map((line) => (line.productId === productId ? { ...line, quantity: line.quantity - 1 } : line)).filter((line) => line.quantity > 0)
    );
  }

  function remove(productId: string) {
    setLines((prev) => prev.filter((line) => line.productId !== productId));
  }

  function clear() {
    setLines([]);
  }

  return <CartContext.Provider value={{ lines, addItem, increment, decrement, remove, clear }}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
