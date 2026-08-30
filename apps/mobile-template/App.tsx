import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Button, ProductGrid, ThemeProvider, formatPrice, type StorefrontTheme } from "@storeforge/ui-native";
import { createStorefrontApiClient, type ProductSummary } from "@storeforge/api-client";
import { getApiBaseUrl } from "./lib/api-base-url";
import { createSecureTokenStorage } from "./lib/secure-token-storage";
import { CartProvider, useCart } from "./lib/cart-context";

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

const API_BASE_URL = getApiBaseUrl();

// A single client instance for the app's lifetime -- its token storage is
// backed by SecureStore, so a logged-in session survives an app restart
// with no extra code here (see lib/secure-token-storage.ts).
const apiClient = createStorefrontApiClient(API_BASE_URL, createSecureTokenStorage());

type Screen = "catalog" | "cart" | "order";

export default function App() {
  return (
    <CartProvider>
      <StorefrontDemo />
    </CartProvider>
  );
}

function StorefrontDemo() {
  const [theme, setTheme] = useState(THEME_A);
  const [screen, setScreen] = useState<Screen>("catalog");
  const [products, setProducts] = useState<ProductSummary[]>(PLACEHOLDER_PRODUCTS);
  const [apiStatus, setApiStatus] = useState<"loading" | "live" | "offline">("loading");
  const [gatewayOrderId, setGatewayOrderId] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const cart = useCart();

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
        setApiStatus("live");
      })
      .catch(() => {
        if (cancelled) return;
        setApiStatus("offline");
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

  async function handleToggleWishlist(product: ProductSummary) {
    try {
      const result = await apiClient.toggleWishlist(product.id);
      setAuthMessage(result.wishlisted ? `Wishlisted ${product.name}.` : `Removed ${product.name} from wishlist.`);
    } catch {
      setAuthMessage("Wishlist action failed -- log in first.");
    }
  }

  function addProductToCart(productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    cart.addItem({ productId: product.id, name: product.name, price: product.price });
  }

  async function handlePlaceOrder() {
    const lines = cart.lines.map((line) => ({ productId: line.productId, price: line.price, quantity: line.quantity }));
    const result = await apiClient.placeOrder(lines);

    if (!result.isMocked) {
      // No native Razorpay SDK usable from Expo Go -- hand off to
      // Razorpay's own hosted Checkout.js in the system browser (see
      // apps/beautifulmess's app/checkout/mobile-pay/[gatewayOrderId]
      // page). The real webhook is the authoritative source for marking
      // the order PAID; this app just polls for that once the shopper
      // returns (see the "order" screen below).
      await WebBrowser.openBrowserAsync(`${API_BASE_URL}/checkout/mobile-pay/${result.gatewayOrderId}?amount=${result.amount}`);
    }

    cart.clear();
    setGatewayOrderId(result.gatewayOrderId);
    setScreen("order");
  }

  return (
    <ThemeProvider theme={theme}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colorBackground }]}>
        <View style={styles.headerRow}>
          <Button
            label={theme === THEME_A ? "Switch to Theme B" : "Switch to Theme A"}
            onPress={() => setTheme((current) => (current === THEME_A ? THEME_B : THEME_A))}
          />
          {screen === "catalog" ? (
            <Button label={`Cart (${cart.lines.length})`} variant="outline" onPress={() => setScreen("cart")} />
          ) : null}
        </View>

        {apiStatus === "offline" ? (
          <Text style={{ color: theme.colorForeground, fontFamily: theme.fontSans }}>
            Showing placeholder products -- couldn&apos;t reach the storefront API.
          </Text>
        ) : null}

        {screen === "catalog" ? (
          <CatalogScreen
            theme={theme}
            products={products}
            isLoggedIn={isLoggedIn}
            email={email}
            password={password}
            authMessage={authMessage}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onLogIn={handleLogIn}
            onSelectProduct={addProductToCart}
            onToggleWishlist={handleToggleWishlist}
          />
        ) : null}

        {screen === "cart" ? (
          <CartScreen theme={theme} onBack={() => setScreen("catalog")} onCheckout={handlePlaceOrder} />
        ) : null}

        {screen === "order" && gatewayOrderId ? (
          <OrderScreen theme={theme} gatewayOrderId={gatewayOrderId} onBackToShop={() => setScreen("catalog")} />
        ) : null}

        <StatusBar style="auto" />
      </SafeAreaView>
    </ThemeProvider>
  );
}

function CatalogScreen({
  theme,
  products,
  isLoggedIn,
  email,
  password,
  authMessage,
  onEmailChange,
  onPasswordChange,
  onLogIn,
  onSelectProduct,
  onToggleWishlist,
}: {
  theme: StorefrontTheme;
  products: ProductSummary[];
  isLoggedIn: boolean;
  email: string;
  password: string;
  authMessage: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLogIn: () => void;
  onSelectProduct: (productId: string) => void;
  onToggleWishlist: (product: ProductSummary) => void;
}) {
  return (
    <>
      {isLoggedIn ? (
        <Button
          label="Toggle wishlist on first product"
          variant="outline"
          onPress={() => products[0] && onToggleWishlist(products[0])}
        />
      ) : (
        <>
          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={onEmailChange}
            style={[styles.input, { borderColor: theme.colorBorder, color: theme.colorForeground }]}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={onPasswordChange}
            style={[styles.input, { borderColor: theme.colorBorder, color: theme.colorForeground }]}
          />
          <Button label="Log in" onPress={onLogIn} />
        </>
      )}
      {authMessage ? <Text style={{ color: theme.colorForeground, fontFamily: theme.fontSans }}>{authMessage}</Text> : null}

      <Text style={{ color: theme.colorForeground, fontFamily: theme.fontSans }}>Tap a product to add it to your cart.</Text>
      <ProductGrid products={products} onSelectProduct={onSelectProduct} />
    </>
  );
}

function CartScreen({ theme, onBack, onCheckout }: { theme: StorefrontTheme; onBack: () => void; onCheckout: () => void }) {
  const { lines, increment, decrement, remove } = useCart();
  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  return (
    <>
      <Button label="Back to shop" variant="outline" onPress={onBack} />
      {lines.length === 0 ? <Text style={{ color: theme.colorForeground }}>Your cart is empty.</Text> : null}
      {lines.map((line) => (
        <View key={line.productId} style={styles.cartRow}>
          <Text style={{ color: theme.colorForeground, fontFamily: theme.fontSans, flex: 1 }}>
            {line.name} x{line.quantity}
          </Text>
          <Text style={{ color: theme.colorForeground, fontFamily: theme.fontSans }}>{formatPrice(line.price * line.quantity)}</Text>
          <Button label="-" variant="outline" onPress={() => decrement(line.productId)} />
          <Button label="+" variant="outline" onPress={() => increment(line.productId)} />
          <Button label="Remove" variant="outline" onPress={() => remove(line.productId)} />
        </View>
      ))}
      <Text style={{ color: theme.colorForeground, fontFamily: theme.fontSans, fontWeight: "700" }}>Total: {formatPrice(total)}</Text>
      <Button label="Checkout" onPress={onCheckout} disabled={lines.length === 0} />
    </>
  );
}

function OrderScreen({
  theme,
  gatewayOrderId,
  onBackToShop,
}: {
  theme: StorefrontTheme;
  gatewayOrderId: string;
  onBackToShop: () => void;
}) {
  const [status, setStatus] = useState<string>("Checking...");

  useEffect(() => {
    let cancelled = false;

    function poll() {
      apiClient
        .getOrderStatus(gatewayOrderId)
        .then((order) => {
          if (!cancelled) setStatus(order.status);
        })
        .catch(() => {
          if (!cancelled) setStatus("Unknown");
        });
    }

    poll();
    // The Razorpay webhook (not this app) is the authoritative source for
    // marking the order PAID -- this just re-checks periodically so the
    // status updates once it arrives, same as the web order page's
    // eventual-consistency model.
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [gatewayOrderId]);

  return (
    <>
      <Text style={{ color: theme.colorForeground, fontFamily: theme.fontSans }}>Order {gatewayOrderId}</Text>
      <Text style={{ color: theme.colorForeground, fontFamily: theme.fontSans, fontWeight: "700" }}>Status: {status}</Text>
      <Button label="Back to shop" onPress={onBackToShop} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
