import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@storeforge/ui-native";
import { CartProvider } from "../lib/cart-context";
import { BEAUTIFULMESS_THEME } from "../lib/theme";
import { apiClient } from "../lib/api-client";
import { registerForPushNotificationsAsync } from "../lib/register-for-push-notifications";

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

export default function RootLayout() {
  useEffect(() => {
    void setUpNotificationHandler();
    apiClient.isLoggedIn().then((loggedIn) => {
      if (loggedIn) void registerPushTokenIfPossible();
    });
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={BEAUTIFULMESS_THEME}>
        <CartProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: BEAUTIFULMESS_THEME.colorBackground },
              headerTintColor: BEAUTIFULMESS_THEME.colorForeground,
              contentStyle: { backgroundColor: BEAUTIFULMESS_THEME.colorBackground },
            }}
          >
            <Stack.Screen name="index" options={{ title: "Beautiful Mess" }} />
            <Stack.Screen name="shop/index" options={{ title: "Shop" }} />
            <Stack.Screen name="shop/[collectionSlug]" options={{ title: "Shop" }} />
            <Stack.Screen name="products/[slug]" options={{ title: "" }} />
            <Stack.Screen name="search" options={{ title: "Search" }} />
            <Stack.Screen name="cart" options={{ title: "Cart" }} />
            <Stack.Screen name="orders/[gatewayOrderId]" options={{ title: "Order" }} />
            <Stack.Screen name="account/login" options={{ title: "Log in" }} />
            <Stack.Screen name="account/signup" options={{ title: "Sign up" }} />
            <Stack.Screen name="about" options={{ title: "About Us" }} />
            <Stack.Screen name="help/contact" options={{ title: "Contact" }} />
            <Stack.Screen name="help/careers" options={{ title: "Careers" }} />
            <Stack.Screen name="help/franchise" options={{ title: "Franchise" }} />
            <Stack.Screen name="help/press" options={{ title: "PR & Events" }} />
            <Stack.Screen name="policies/privacy" options={{ title: "Privacy Policy" }} />
            <Stack.Screen name="policies/refund" options={{ title: "Refund Policy" }} />
            <Stack.Screen name="policies/shipping" options={{ title: "Shipping Policy" }} />
            <Stack.Screen name="policies/terms" options={{ title: "Terms of Service" }} />
          </Stack>
          <StatusBar style="auto" />
        </CartProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

async function registerPushTokenIfPossible() {
  try {
    const token = await registerForPushNotificationsAsync();
    if (token) await apiClient.registerPushToken(token);
  } catch {
    // Best-effort -- a denied permission or simulator with no push
    // capability shouldn't block the rest of the app.
  }
}
