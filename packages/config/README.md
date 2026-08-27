# @storeforge/config

Single source of truth for TypeScript, ESLint, and Tailwind across every
Storeforge package and app. Nothing in this package is client- or
storefront-specific -- it exists so a new package or app inherits the
platform's rules by extending three files, with zero local overrides.

## Usage

Add the package as a workspace dependency:

```json
{
  "devDependencies": {
    "@storeforge/config": "workspace:*"
  }
}
```

### TypeScript

```json
// tsconfig.json
{
  "extends": "@storeforge/config/tsconfig.base.json",
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "include": ["src"]
}
```

### ESLint

```js
// eslint.config.js
export { default } from "@storeforge/config/eslint.js";
```

This includes the two hard security bans every package and app must keep:
`$queryRawUnsafe` with interpolated input, and `dangerouslySetInnerHTML`
without an explicit reviewer justification.

### Tailwind

```js
// tailwind.config.js
import preset from "@storeforge/config/tailwind.preset.js";

export default {
  presets: [preset],
  content: ["./src/**/*.{ts,tsx}"],
};
```

The preset only defines tokens as CSS variables (`--sf-color-brand`,
`--sf-font-sans`, etc.). Each storefront app supplies its own values for
those variables (typically in a root `globals.css`) to get its own branding
without touching `packages/ui`.
