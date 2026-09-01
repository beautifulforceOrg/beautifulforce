import type { Metadata } from "next";
import { Cormorant, Poppins } from "next/font/google";
import type { ReactNode } from "react";
import { ThemeProvider, type StorefrontTheme } from "@storeforge/ui";
import { CartProvider } from "../lib/cart-context";
import { getSessionCustomerId } from "../lib/auth";
import { isCustomerAnAdmin } from "../lib/admin/auth";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { TrustBadges } from "./trust-badges";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
});

const cormorant = Cormorant({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-cormorant",
});

// Mapped directly from this client's real Shopify theme settings
// (data/shopify-export/settings_data.json, color_schemes.scheme-1 and
// the type_body_font/type_heading_font choices) -- not invented.
//
// colorForeground/colorMuted are darkened from the real theme's #858585 --
// that value is only 3.69:1 against white, below WCAG AA's 4.5:1 for body
// text, which axe-core's a11y suite (e2e/a11y.spec.ts) caught on this
// exact color. #595959/#6B6B6B keep the same grey character while passing.
//
// colorBrand is likewise a deeper shade of the real pastel coral
// (#F38B88, only 2.37:1 with white text -- axe flagged this on both the
// "Add to cart" button and brand-colored link text). #F38B88 itself is
// kept as colorBorder, where it's decorative and not a text-contrast
// concern -- a deeper accent for interactive/text elements alongside a
// lighter one for borders is a normal real-world accessibility pattern.
const theme: StorefrontTheme = {
  colorBrand: "#C0504D",
  colorBrandForeground: "#FFFFFF",
  colorBackground: "#FFFFFF",
  colorForeground: "#595959",
  colorMuted: "#6B6B6B",
  colorBorder: "#F38B88",
  fontSans: "var(--font-poppins), ui-sans-serif, sans-serif",
  fontHeading: "var(--font-cormorant), serif",
};

export const metadata: Metadata = {
  title: "Beautiful Mess",
  description: "Playful, elegant kidswear and accessories from Beautiful Mess.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const customerId = await getSessionCustomerId();
  const isLoggedIn = Boolean(customerId);
  const isAdmin = customerId ? await isCustomerAnAdmin(customerId) : false;

  return (
    <html lang="en" className={`${poppins.variable} ${cormorant.variable}`}>
      <body>
        <ThemeProvider theme={theme}>
          <CartProvider>
            <SiteHeader isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
            {children}
            <TrustBadges />
            <SiteFooter />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
