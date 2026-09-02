import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Cormorant, Poppins } from "next/font/google";
import type { ReactNode } from "react";
import { ThemeProvider, type StorefrontTheme } from "@storeforge/ui";
import { CartProvider } from "../lib/cart-context";
import { getSessionCustomerId } from "../lib/auth";
import { isCustomerAnAdmin } from "../lib/admin/auth";
import { BUSINESS_INFO, LOGO_URL, SITE_NAME, SITE_URL } from "../lib/site-config";
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

const SITE_DESCRIPTION = "Playful, elegant kidswear and accessories from Beautiful Mess.";

export const metadata: Metadata = {
  // Lets every relative image URL in per-page metadata (generateMetadata's
  // openGraph.images, etc.) resolve correctly -- unset before, which is a
  // real (if minor) gap for any page that hands Next.js a relative path.
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    images: [{ url: LOGO_URL }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [LOGO_URL],
  },
  // Renders <meta name="google-site-verification" content="..."> only
  // once GOOGLE_SITE_VERIFICATION is actually set -- a one-line paste of
  // the code Google Search Console gives you when verifying this site
  // (Settings > Ownership verification > HTML tag method, since there's
  // no custom domain yet for DNS-based verification). See
  // docs/pending-actions.md for the full Search Console follow-up.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

// LocalBusiness (a Clothing Store subtype) JSON-LD -- real address/phone
// already shown on-page (site-footer.tsx, help/contact/page.tsx), not
// invented. Site-wide rather than homepage-only, matching how most small
// real-world business sites surface this on every page.
const LOCAL_BUSINESS_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ClothingStore",
  name: BUSINESS_INFO.name,
  image: LOGO_URL,
  url: SITE_URL,
  telephone: BUSINESS_INFO.telephone,
  address: {
    "@type": "PostalAddress",
    streetAddress: BUSINESS_INFO.streetAddress,
    addressLocality: BUSINESS_INFO.addressLocality,
    addressRegion: BUSINESS_INFO.addressRegion,
    postalCode: BUSINESS_INFO.postalCode,
    addressCountry: BUSINESS_INFO.addressCountry,
  },
  sameAs: [BUSINESS_INFO.instagramUrl, BUSINESS_INFO.facebookUrl],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const customerId = await getSessionCustomerId();
  const isLoggedIn = Boolean(customerId);
  const isAdmin = customerId ? await isCustomerAnAdmin(customerId) : false;

  return (
    <html lang="en" className={`${poppins.variable} ${cormorant.variable}`}>
      <body>
        <script
          type="application/ld+json"
          // eslint-disable-next-line no-restricted-syntax -- JSON.stringify of our own static, code-defined object, never user input
          dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_JSON_LD) }}
        />
        <ThemeProvider theme={theme}>
          <CartProvider>
            <SiteHeader isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
            {children}
            <TrustBadges />
            <SiteFooter />
          </CartProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
