import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text } from "react-native";
import { Button, ProductGrid, ThemeProvider, type StorefrontTheme } from "@storeforge/ui-native";
import { createStorefrontApiClient, type ProductSummary } from "@storeforge/api-client";
import { getApiBaseUrl } from "./lib/api-base-url";

// Two placeholder StorefrontTheme objects -- standing in for what a real
// client config (e.g. Beautiful Mess's) will supply. Swapping which one is
// active re-skins the whole screen with no change to ProductGrid/Button.
const THEME_A: StorefrontTheme = {
  colorBrand: "#C0504D",
  colorBrandForeground: "#FFFFFF",
  colorBackground: "#FFF7F5",
  colorForeground: "#2B2320",
  colorMuted: "#F0DCD8",
  colorBorder: "#E8C9C4",
  fontSans: "System",
  radius: 12,
};

const THEME_B: StorefrontTheme = {
  colorBrand: "#1F5D50",
  colorBrandForeground: "#FFFFFF",
  colorBackground: "#F3FAF8",
  colorForeground: "#12211D",
  colorMuted: "#D6ECE6",
  colorBorder: "#B9DAD1",
  fontSans: "System",
  radius: 2,
};

// Shown while the real catalog is loading, and as a fallback if
// apps/beautifulmess's dev server isn't reachable -- keeps the theming
// demo from Phase 1 working with zero backend.
const PLACEHOLDER_PRODUCTS: ProductSummary[] = [
  { id: "1", slug: "blue-frock", name: "Blue Frock", price: 550000, inStock: true },
  { id: "2", slug: "sling-bag", name: "Sling Bag", price: 150000, inStock: true },
  { id: "3", slug: "bow-hairclip", name: "Bow Hairclip", price: 45000, inStock: true },
  { id: "4", slug: "canvas-sneakers", name: "Canvas Sneakers", price: 320000, inStock: true },
];

export default function App() {
  const [theme, setTheme] = useState(THEME_A);
  const [products, setProducts] = useState<ProductSummary[]>(PLACEHOLDER_PRODUCTS);
  const [status, setStatus] = useState<"loading" | "live" | "offline">("loading");

  useEffect(() => {
    let cancelled = false;
    const client = createStorefrontApiClient(getApiBaseUrl());

    client
      .getFeaturedProducts()
      .then((fetched) => {
        if (cancelled) return;
        setProducts(fetched);
        setStatus("live");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("offline");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colorBackground }]}>
        <Button
          label={theme === THEME_A ? "Switch to Theme B" : "Switch to Theme A"}
          onPress={() => setTheme((current) => (current === THEME_A ? THEME_B : THEME_A))}
        />
        {status === "offline" ? (
          <Text style={{ color: theme.colorForeground, fontFamily: theme.fontSans }}>
            Showing placeholder products -- couldn&apos;t reach the storefront API.
          </Text>
        ) : null}
        <ProductGrid products={products} onSelectProduct={() => {}} />
        <StatusBar style="auto" />
      </SafeAreaView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
});
