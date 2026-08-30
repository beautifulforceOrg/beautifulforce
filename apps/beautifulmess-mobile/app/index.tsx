import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { ProductGrid, useTheme } from "@storeforge/ui-native";
import type { ProductSummary } from "@storeforge/api-client";
import { NavBar } from "../components/nav-bar";
import { apiClient } from "../lib/api-client";
import { useCart } from "../lib/cart-context";

const PLACEHOLDER_PRODUCTS: ProductSummary[] = [
  { id: "1", slug: "blue-frock", name: "Blue Frock", price: 550000, inStock: true },
  { id: "2", slug: "sling-bag", name: "Sling Bag", price: 150000, inStock: true },
  { id: "3", slug: "bow-hairclip", name: "Bow Hairclip", price: 45000, inStock: true },
  { id: "4", slug: "canvas-sneakers", name: "Canvas Sneakers", price: 320000, inStock: true },
];

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const cart = useCart();
  const [products, setProducts] = useState<ProductSummary[]>(PLACEHOLDER_PRODUCTS);
  const [apiStatus, setApiStatus] = useState<"loading" | "live" | "offline">("loading");

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getFeaturedProducts()
      .then((fetched) => {
        if (!cancelled) {
          setProducts(fetched);
          setApiStatus("live");
        }
      })
      .catch(() => {
        if (!cancelled) setApiStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSelectProduct(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (product) router.push(`/products/${product.slug}`);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colorBackground }}>
      <NavBar cartCount={cart.lines.length} />
      {apiStatus === "offline" ? (
        <Text style={{ color: theme.colorForeground, fontFamily: theme.fontSans, paddingHorizontal: 16 }}>
          Showing placeholder products -- couldn&apos;t reach the storefront API.
        </Text>
      ) : null}
      <ProductGrid products={products} onSelectProduct={handleSelectProduct} />
    </View>
  );
}
