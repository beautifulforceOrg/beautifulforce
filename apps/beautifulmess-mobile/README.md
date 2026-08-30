# apps/beautifulmess-mobile

Beautiful Mess's real mobile app -- forked from `apps/mobile-template`
(Phase 7 of the mobile plan), the same way `apps/beautifulmess` forked
from `apps/_template` for the web storefront. Real branding
(`app.config.ts`), real theme colors (matching `apps/beautifulmess`'s own
`app/layout.tsx`), and points at `apps/beautifulmess`'s API/DB -- there is
no separate mobile backend or database; this app is another client of the
same `app/api/mobile/**` routes the reference template talks to.

## Local development

```
pnpm --filter @storeforge/beautifulmess-mobile dev      # Expo Go / dev client
pnpm --filter @storeforge/beautifulmess-mobile test      # Jest (jest-expo)
pnpm --filter @storeforge/beautifulmess-mobile typecheck
pnpm --filter @storeforge/beautifulmess-mobile lint
```

By default the app points at `http://localhost:3000` for `apps/beautifulmess`'s
dev server -- override with `EXPO_PUBLIC_API_BASE_URL` to point at a
deployed environment (e.g. the Preview or production Vercel URL) instead.

## Known simplifications vs. the web app

- `assets/*.png` are still Expo's generic scaffolding icons, not Beautiful
  Mess's real logo/icon assets -- swapping them in is asset work, not
  code, and doesn't block anything else in this pilot.
- `fontSans` stays the RN default ("System") rather than the web app's
  real Poppins/Cormorant -- loading custom Google Fonts on RN needs
  `expo-font` plus downloaded font assets, a follow-up.
- No branded splash screen yet (`app.config.ts`'s top-level `splash` key
  was removed from `ExpoConfig` in SDK 53+ in favor of the
  `expo-splash-screen` config plugin) -- another follow-up, not required
  for the checkout/push flow.
- No dedicated product-detail screen: tapping a product in the catalog
  grid adds it straight to cart, same intentional scope cut as
  `apps/mobile-template`'s Phase 4.

## EAS Build (preview binaries, free tier)

CI's `mobile-build` job (`.github/workflows/ci.yml`) currently only
builds `apps/mobile-template`. Wiring up this app's own EAS project (its
own `eas init`, its own `EXPO_TOKEN` or shared org-level token, its own
CI job or matrix entry) is a straightforward follow-up once this pilot is
ready to ship a real preview build -- see `apps/mobile-template/README.md`
for the exact one-time setup steps, which are identical here.
