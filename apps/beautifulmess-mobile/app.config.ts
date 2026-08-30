import type { ExpoConfig } from "expo/config";
import type { StorefrontMobileConfig } from "@storeforge/mobile-config";

// Mapped from the same real Shopify theme settings apps/beautifulmess's
// own app/layout.tsx uses (colorBrand/colorBrandForeground/colorBackground
// only -- app.config.ts only needs enough of the theme to paint the
// splash screen and adaptive icon background, not the full StorefrontTheme).
const BEAUTIFULMESS_MOBILE_CONFIG: StorefrontMobileConfig = {
  appName: "Beautiful Mess",
  slug: "beautifulmess-mobile",
  bundleIdentifier: "com.beautifulforce.beautifulmess",
  androidPackage: "com.beautifulforce.beautifulmess",
  // Set once `eas init` has run for this app's own EAS project -- see
  // README.md. Until then, EAS builds for this app aren't configured.
  theme: {
    colorBrand: "#C0504D",
    colorBrandForeground: "#FFFFFF",
    colorBackground: "#FFFFFF",
  },
};

// buildExpoConfig() from @storeforge/mobile-config implements this exact
// merge and has its own test coverage there -- it isn't called here
// because Expo's config loader executes app.config.ts directly under
// Node's CommonJS `require()`, outside Metro/the app's own bundler, and
// @storeforge/mobile-config ships ESM source with no build step. A
// runtime `import` of it fails with "Unexpected token 'export'"; only
// type-only imports (erased at compile time) are safe here. If
// @storeforge/mobile-config ever gains a real CJS build output, switch
// this back to calling buildExpoConfig(BEAUTIFULMESS_MOBILE_CONFIG, {...}).
const config: ExpoConfig = {
  name: BEAUTIFULMESS_MOBILE_CONFIG.appName,
  slug: BEAUTIFULMESS_MOBILE_CONFIG.slug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: BEAUTIFULMESS_MOBILE_CONFIG.bundleIdentifier,
  },
  android: {
    package: BEAUTIFULMESS_MOBILE_CONFIG.androidPackage,
    adaptiveIcon: {
      backgroundColor: BEAUTIFULMESS_MOBILE_CONFIG.theme.colorBackground,
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  // Top-level `splash` was removed from ExpoConfig in favor of the
  // expo-splash-screen config plugin (SDK 53+) -- adding a real branded
  // splash screen is a follow-up, not required for this pilot's
  // checkout/push flow to work.
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: ["expo-secure-store", "expo-web-browser"],
  extra: BEAUTIFULMESS_MOBILE_CONFIG.easProjectId ? { eas: { projectId: BEAUTIFULMESS_MOBILE_CONFIG.easProjectId } } : {},
};

export default config;
