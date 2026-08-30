import type { StorefrontTheme } from "@storeforge/ui-native";

// Mapped from the same real Shopify theme settings apps/beautifulmess's
// own app/layout.tsx uses -- see that file's comment for the accessible
// color adjustments (darkened grey/coral for text contrast). fontSans
// stays "System" here rather than the web's Poppins/Cormorant: loading
// custom Google Fonts on RN needs expo-font + downloaded font assets,
// a follow-up, not required for content parity to work.
export const BEAUTIFULMESS_THEME: StorefrontTheme = {
  colorBrand: "#C0504D",
  colorBrandForeground: "#FFFFFF",
  colorBackground: "#FFFFFF",
  colorForeground: "#595959",
  colorMuted: "#6B6B6B",
  colorBorder: "#F38B88",
  fontSans: "System",
  radius: 8,
};
