import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, TextInput } from "react-native";
import { Button, ProductGrid, ThemeProvider, type StorefrontTheme } from "@storeforge/ui-native";
import { createStorefrontApiClient, type ProductSummary } from "@storeforge/api-client";
import { getApiBaseUrl } from "./lib/api-base-url";
import { createSecureTokenStorage } from "./lib/secure-token-storage";

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

// A single client instance for the app's lifetime -- its token storage is
// backed by SecureStore, so a logged-in session survives an app restart
// with no extra code here (see lib/secure-token-storage.ts).
const apiClient = createStorefrontApiClient(getApiBaseUrl(), createSecureTokenStorage());

export default function App() {
  const [theme, setTheme] = useState(THEME_A);
  const [products, setProducts] = useState<ProductSummary[]>(PLACEHOLDER_PRODUCTS);
  const [status, setStatus] = useState<"loading" | "live" | "offline">("loading");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;

    apiClient.isLoggedIn().then((loggedIn) => {
      if (!cancelled) setIsLoggedIn(loggedIn);
    });

    apiClient
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

  async function handleLogIn() {
    setAuthMessage(null);
    try {
      await apiClient.logIn(email, password);
      setIsLoggedIn(true);
      setAuthMessage("Logged in.");
    } catch {
      setAuthMessage("Login failed.");
    }
  }

  async function handleToggleFirstProductWishlist() {
    const first = products[0];
    if (!first) return;
    try {
      const result = await apiClient.toggleWishlist(first.id);
      setAuthMessage(result.wishlisted ? `Wishlisted ${first.name}.` : `Removed ${first.name} from wishlist.`);
    } catch {
      setAuthMessage("Wishlist action failed -- log in first.");
    }
  }

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

        {isLoggedIn ? (
          <Button label="Toggle wishlist on first product" onPress={handleToggleFirstProductWishlist} variant="outline" />
        ) : (
          <>
            <TextInput
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={[styles.input, { borderColor: theme.colorBorder, color: theme.colorForeground }]}
            />
            <TextInput
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={[styles.input, { borderColor: theme.colorBorder, color: theme.colorForeground }]}
            />
            <Button label="Log in" onPress={handleLogIn} />
          </>
        )}
        {authMessage ? <Text style={{ color: theme.colorForeground, fontFamily: theme.fontSans }}>{authMessage}</Text> : null}

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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
