// Single source of truth for the real business info used across metadata,
// JSON-LD structured data, sitemap.ts, and robots.ts -- all values here
// are the same real facts already shown on app/site-footer.tsx and
// app/help/contact/page.tsx, not invented.

// No custom domain is configured yet (see CLAUDE.md's Isolation section --
// each storefront gets its own domain eventually); this env var lets that
// happen without another code change, but must be set for real in Vercel
// once a domain exists, not left on this fallback indefinitely.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://beautifulforce-beautifulmess.vercel.app";

export const SITE_NAME = "Beautiful Mess";

export const BUSINESS_INFO = {
  name: "Beautiful Mess",
  streetAddress: "102, Railway Parallel Road, 6th Cross, Kumara Park West",
  addressLocality: "Bengaluru",
  addressRegion: "Karnataka",
  postalCode: "560020",
  addressCountry: "IN",
  telephone: "+918088339455",
  instagramUrl: "https://www.instagram.com/beautifulmessbyann/",
  facebookUrl: "https://www.facebook.com/beautifulmessbyann",
};

export const LOGO_URL = "https://ik.imagekit.io/beautifulforce/beautifulmess/BM_Logo.png";
