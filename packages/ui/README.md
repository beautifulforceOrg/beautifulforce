# @storeforge/ui

Shared cart, checkout, and product-grid components. No component here reads
a client's brand color, font, or logo directly -- every visual identity
comes from a storefront through `ThemeProvider`.

## Components

- `Button` -- primitive, `default` / `outline` / `ghost` variants
- `ProductCard`, `ProductGrid` -- catalog browsing
- `CartItem`, `CartSummary` -- cart with quantity controls and a computed subtotal
- `CheckoutSteps` -- a step indicator for browse → cart → checkout → confirmation
- `VariantPicker` -- a radio-group option selector (size, denomination, ...) for a product with variants
- `ThemeProvider` -- injects a storefront's theme as CSS variables

## Theming contract

A storefront wraps its app in `ThemeProvider` and supplies a `StorefrontTheme`:

```tsx
import { ThemeProvider } from "@storeforge/ui";

<ThemeProvider
  theme={{
    colorBrand: "#1B4332",
    colorBrandForeground: "#FFFFFF",
    colorBackground: "#FFFFFF",
    colorForeground: "#111111",
    colorMuted: "#6B7280",
    colorBorder: "#E5E7EB",
    fontSans: "'Fraunces', serif",
    fontHeading: "'Cormorant', serif", // optional -- a storefront with one font can omit this
  }}
>
  <App />
</ThemeProvider>
```

This sets `--sf-color-brand`, `--sf-font-sans`, `--sf-font-heading`, etc. on a wrapping element --
the same variable names `packages/config/tailwind.preset.js` maps Tailwind's
`bg-brand`, `font-sans`, and friends onto. Swapping the theme object is the
entire branding surface; no component file ever needs to change.

`theme-provider.test.tsx` is the enforcement mechanism: it renders `Button`
under two unrelated themes and asserts the component's className is
byte-for-byte identical both times. If a future component starts branching
on theme instead of reading it through these variables, that test fails.
