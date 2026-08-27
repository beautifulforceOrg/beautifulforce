/**
 * Shared Tailwind preset for every Storeforge storefront.
 *
 * Every color, font, and radius here resolves through a CSS variable rather
 * than a literal value. packages/ui components are styled exclusively
 * through these tokens, so no shared component ever bakes in one client's
 * brand -- a storefront supplies its own values for these variables (see
 * packages/config/README.md) and the same component looks native to it.
 *
 * @type {import('tailwindcss').Config}
 */
const preset = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--sf-color-brand)",
          foreground: "var(--sf-color-brand-foreground)",
        },
        background: "var(--sf-color-background)",
        foreground: "var(--sf-color-foreground)",
        muted: "var(--sf-color-muted)",
        border: "var(--sf-color-border)",
      },
      fontFamily: {
        sans: ["var(--sf-font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        // Falls back to the body font for a storefront that doesn't set a
        // distinct heading face.
        heading: ["var(--sf-font-heading, var(--sf-font-sans))", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "var(--sf-radius, 0.5rem)",
      },
    },
  },
};

export default preset;
