"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { fetchServerCart, syncServerCart } from "./cart-actions";
import { mergeCartLines } from "./cart-merge";

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
  // Only set for the gift-card product's "send to a friend" flow. There's
  // no transactional email provider wired up yet, so this is stored and
  // shown at checkout for a human to action, not auto-sent -- see
  // product-detail.tsx's gift-card recipient fields.
  giftRecipientEmail?: string;
  giftRecipientName?: string;
  giftMessage?: string;
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

export function CartProvider({ children, isLoggedIn = false }: { children: ReactNode; isLoggedIn?: boolean }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  // Gates the sync-out effect until the one-time merge-in check below has
  // actually finished. Both effects share `isLoggedIn` in their
  // dependency arrays, so without this they fire in the same pass on
  // login -- sync-out would otherwise push the guest's pre-merge local
  // cart to the server (fetchServerCart's promise hasn't resolved yet),
  // clobbering whatever was already saved there before the merge ever
  // lands. A real bug caught by e2e/cart-sync.spec.ts's merge test.
  const [mergeChecked, setMergeChecked] = useState(false);
  // The sync-out effect below only runs when this is true -- NOT simply
  // whenever `lines` changes. `lines` also changes on an ordinary mount
  // (hydrating from localStorage, or the merge-in effect re-setting it to
  // a value that may be unchanged or even emptier than the real
  // server-side cart, e.g. a second device with no local items reading an
  // already-populated server cart). Syncing on every such change risks
  // pushing a stale/empty snapshot that overwrites real data another
  // device just wrote. This is set explicitly by the mutation functions
  // (addItem etc.) and by the merge-in effect when there's genuinely
  // something to reconcile, and cleared once a sync is queued for it.
  const pendingSync = useRef(false);
  // Chains every sync-out call after the previous one's completion, so
  // concurrent requests always finish in the order they were issued.
  // Without this, two syncs fired close together can resolve out of order
  // over the network -- whichever response lands last wins and silently
  // overwrites the newer cart with the stale one. A real race caught by
  // e2e/cart-sync.spec.ts under load.
  const syncQueue = useRef<Promise<void>>(Promise.resolve());

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

  // One-time merge-in of a logged-in customer's server-persisted cart
  // (see lib/cart-sync.ts) -- e.g. items added on another device. A
  // guest browsing with items already in localStorage keeps them; if
  // both have items, they're combined rather than one silently
  // replacing the other. No-op for a guest (fetchServerCart resolves []).
  useEffect(() => {
    if (!hydrated) return;
    if (!isLoggedIn) {
      setMergeChecked(true);
      return;
    }
    fetchServerCart().then((serverLines) => {
      setLines((current) => {
        // Something needs reconciling with the server whenever either
        // side is non-empty -- a guest's pre-login local items need
        // pushing up even if the server had nothing, and a merged result
        // needs pushing back so every device converges on it. If both
        // are empty there's nothing to do, and staying quiet avoids an
        // unnecessary (and, under a race, risky) write.
        if (current.length > 0 || serverLines.length > 0) pendingSync.current = true;
        return serverLines.length > 0 ? mergeCartLines(current, serverLines) : current;
      });
      setMergeChecked(true);
    });
    // Only ever once per mount/login -- re-running on every `lines`
    // change would re-merge the same server cart back in repeatedly, so
    // `lines`/`fetchCart` are deliberately not in this dependency array.
  }, [hydrated, isLoggedIn]);

  // Best-effort background sync to the server for a logged-in customer
  // (see lib/cart-actions.ts) -- fire-and-forget, never blocks the UI;
  // a no-op for a guest. Gated on `mergeChecked` and `pendingSync` -- see
  // their declarations above for why.
  useEffect(() => {
    if (!hydrated || !isLoggedIn || !mergeChecked || !pendingSync.current) return;
    pendingSync.current = false;
    syncQueue.current = syncQueue.current.then(() => syncServerCart(lines).catch(() => {}));
  }, [lines, hydrated, isLoggedIn, mergeChecked]);

  function addItem(item: Omit<CartLine, "quantity">) {
    pendingSync.current = true;
    setLines((prev) => {
      const existing = prev.find((line) => line.productId === item.productId);
      if (existing) {
        return prev.map((line) =>
          line.productId === item.productId
            ? {
                ...line,
                variantId: item.variantId,
                variantLabel: item.variantLabel,
                giftRecipientEmail: item.giftRecipientEmail,
                giftRecipientName: item.giftRecipientName,
                giftMessage: item.giftMessage,
                quantity: line.quantity + 1,
              }
            : line
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function increment(productId: string) {
    pendingSync.current = true;
    setLines((prev) =>
      prev.map((line) => (line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line))
    );
  }

  function decrement(productId: string) {
    pendingSync.current = true;
    setLines((prev) =>
      prev
        .map((line) => (line.productId === productId ? { ...line, quantity: line.quantity - 1 } : line))
        .filter((line) => line.quantity > 0)
    );
  }

  function remove(productId: string) {
    pendingSync.current = true;
    setLines((prev) => prev.filter((line) => line.productId !== productId));
  }

  function clear() {
    pendingSync.current = true;
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
