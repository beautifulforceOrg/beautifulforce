import { createElement } from "react";
import { create, act } from "react-test-renderer";
import { Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CartProvider, useCart } from "./cart-context";

beforeEach(() => AsyncStorage.clear());

function flushMicrotasks() {
  return act(async () => {
    await Promise.resolve();
  });
}

function CartProbe({ onReady }: { onReady: (cart: ReturnType<typeof useCart>) => void }) {
  const cart = useCart();
  onReady(cart);
  return createElement(
    View,
    null,
    cart.lines.map((line) => createElement(Text, { key: line.productId }, `${line.name}:${line.quantity}`))
  );
}

async function renderCart() {
  let cart!: ReturnType<typeof useCart>;
  let root!: ReturnType<typeof create>;
  await act(async () => {
    root = create(
      createElement(CartProvider, null, createElement(CartProbe, { onReady: (c) => (cart = c) }))
    );
  });
  await flushMicrotasks();
  return { root, getCart: () => cart };
}

describe("CartProvider / useCart", () => {
  it("starts empty", async () => {
    const { root } = await renderCart();
    expect(root.root.findAllByType(Text)).toHaveLength(0);
  });

  it("addItem adds a new line at quantity 1, and a repeat add increments it instead of duplicating", async () => {
    const { root, getCart } = await renderCart();

    await act(async () => getCart().addItem({ productId: "1", name: "Blue Frock", price: 550000 }));
    expect(root.root.findAllByType(Text).map((t) => t.props.children)).toEqual(["Blue Frock:1"]);

    await act(async () => getCart().addItem({ productId: "1", name: "Blue Frock", price: 550000 }));
    expect(root.root.findAllByType(Text).map((t) => t.props.children)).toEqual(["Blue Frock:2"]);
  });

  it("increment and decrement adjust quantity, and decrementing to 0 removes the line", async () => {
    const { root, getCart } = await renderCart();

    await act(async () => getCart().addItem({ productId: "1", name: "Blue Frock", price: 550000 }));
    await act(async () => getCart().increment("1"));
    expect(root.root.findAllByType(Text).map((t) => t.props.children)).toEqual(["Blue Frock:2"]);

    await act(async () => getCart().decrement("1"));
    await act(async () => getCart().decrement("1"));
    expect(root.root.findAllByType(Text)).toHaveLength(0);
  });

  it("remove and clear empty the cart", async () => {
    const { root, getCart } = await renderCart();

    await act(async () => getCart().addItem({ productId: "1", name: "Blue Frock", price: 550000 }));
    await act(async () => getCart().remove("1"));
    expect(root.root.findAllByType(Text)).toHaveLength(0);

    await act(async () => getCart().addItem({ productId: "1", name: "Blue Frock", price: 550000 }));
    await act(async () => getCart().clear());
    expect(root.root.findAllByType(Text)).toHaveLength(0);
  });

  it("throws if used outside a CartProvider", () => {
    const consoleError = console.error;
    console.error = () => {};
    expect(() => {
      act(() => {
        create(createElement(CartProbe, { onReady: () => {} }));
      });
    }).toThrow("useCart must be used within a CartProvider");
    console.error = consoleError;
  });
});
