import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider, type StorefrontTheme } from "@storeforge/ui";
import { CartProvider } from "../lib/cart-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Storeforge reference storefront",
  description: "The reference storefront proving packages/* work together end to end.",
};

// This is the entire branding surface for this storefront -- swapping it
// for another client's colors/fonts requires no changes anywhere else in
// this app or in packages/ui.
const theme: StorefrontTheme = {
  colorBrand: "#1B4332",
  colorBrandForeground: "#FFFFFF",
  colorBackground: "#FFFFFF",
  colorForeground: "#111111",
  colorMuted: "#6B7280",
  colorBorder: "#E5E7EB",
  fontSans: "system-ui, sans-serif",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CartProvider>{children}</CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
