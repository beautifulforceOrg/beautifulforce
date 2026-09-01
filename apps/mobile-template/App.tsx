import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { Button, ProductGrid, ThemeProvider, formatPrice, type StorefrontTheme } from "@storeforge/ui-native";
import { createStorefrontApiClient, type ProductSummary } from "@storeforge/api-client";
import { getApiBaseUrl } from "./lib/api-base-url";
import { createSecureTokenStorage } from "./lib/secure-token-storage";
import { CartProvider, useCart } from "./lib/cart-context";
import { registerForPushNotificationsAsync } from "./lib/register-for-push-notifications";

// `expo-notifications` is imported dynamically wherever it's used in this
// app (here and in lib/register-for-push-notifications.ts), never
// statically -- merely loading that module now throws in Expo Go on
// SDK 53+ (remote-notification support was removed from Expo Go itself),
// and a static top-level import crashes the whole app before any
// try/catch around a function call ever gets a chance to run.
async function setUpNotificationHandler() {
  try {
    const Notifications = await import("expo-notifications");
    // Foreground notifications still show a banner/sound in test mode,
    // same as a backgrounded app would get from the OS.
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Expo Go (SDK 53+): no remote-notification support. A real
    // dev-client/production build still gets this handler registered.
  }
}

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
    <SafeAreaProvider>
      <CartProvider>
        <StorefrontDemo />
      </CartProvider>
    </SafeAreaProvider>
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

    void setUpNotificationHandler();
    apiClient.isLoggedIn().then((loggedIn) => {
      if (cancelled) return;
      setIsLoggedIn(loggedIn);
      if (loggedIn) void registerPushTokenIfPossible();
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

  useEffect(() => {
    // Order-status pushes are received while this listener is mounted,
    // regardless of which screen the user is on -- shown here as a
    // banner-style message, the same authMessage slot the wishlist/login
    // actions use. expo-notifications is imported dynamically (see
    // setUpNotificationHandler's comment above) since merely loading it
    // throws in Expo Go on SDK 53+.
    let subscription: { remove: () => void } | undefined;
    let cancelled = false;

    import("expo-notifications")
      .then((Notifications) => {
        if (cancelled) return;
        subscription = Notifications.addNotificationReceivedListener((notification) => {
          setAuthMessage(notification.request.content.body ?? "New notification");
        });
      })
      .catch(() => {
        // Expo Go (SDK 53+): no remote-notification support.
      });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  async function registerPushTokenIfPossible() {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) await apiClient.registerPushToken(token);
    } catch {
      // Best-effort -- a denied permission or simulator with no push
      // capability shouldn't block the rest of the app.
    }
  }

  async function handleLogIn() {
    setAuthMessage(null);
    try {
      await apiClient.logIn(email, password);
      setIsLoggedIn(true);
      setAuthMessage("Logged in.");
      await registerPushTokenIfPossible();
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
