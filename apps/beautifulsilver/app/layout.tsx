import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { ThemeProvider, type StorefrontTheme } from "@storeforge/ui";
import { CartProvider } from "../lib/cart-context";
import { SiteHeader } from "./site-header";
import "./globals.css";

const heading = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
});
const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Beautiful Silver",
  description: "Handcrafted sterling silver jewellery -- rings, chains, earrings, and more.",
};

// The entire branding surface for this storefront -- a cool, minimal
// "polished metal" palette distinct from apps/beautifulmess's warm one,
// proving packages/ui's theming contract works for a second, unrelated
// brand identity with no shared code changes.
const theme: StorefrontTheme = {
  colorBrand: "#3A4A63",
  colorBrandForeground: "#FFFFFF",
  colorBackground: "#F7F7F8",
  colorForeground: "#1C1E22",
  colorMuted: "#6B7280",
  colorBorder: "#E2E4E8",
  fontSans: `${body.style.fontFamily}, system-ui, sans-serif`,
  fontHeading: `${heading.style.fontFamily}, Georgia, serif`,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
      <body>
        <ThemeProvider theme={theme}>
          <CartProvider>
            <SiteHeader />
            {children}
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
