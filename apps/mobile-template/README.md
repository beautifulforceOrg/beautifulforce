# apps/mobile-template

Storeforge's mobile reference app (Expo / React Native) -- the mobile
counterpart to `apps/_template`. Forks to `apps/<client>-mobile` per
client, same as the web template does. See the mobile plan for the full
phased build (scaffolding, shared design system, API/BFF layer, auth,
shopping flow, push notifications, this CI/EAS pipeline).

## Local development

```
pnpm --filter @storeforge/mobile-template dev      # Expo Go / dev client
pnpm --filter @storeforge/mobile-template test      # Jest (jest-expo)
pnpm --filter @storeforge/mobile-template typecheck
pnpm --filter @storeforge/mobile-template lint
```

By default the app points at `http://localhost:3000` for its storefront
API (`apps/beautifulmess`'s dev server) -- override with
`EXPO_PUBLIC_API_BASE_URL` for a different backend or port.

## EAS Build (preview binaries, free tier)

CI's `mobile-build` job (`.github/workflows/ci.yml`) runs
`eas build --profile preview --platform all --non-interactive --no-wait`
on every push to `main`, entirely on GitHub's standard `ubuntu-latest`
runner -- EAS's cloud builds both the iOS and Android binaries, so no
macOS runner or local Xcode/Android Studio is needed.

This requires a **free Expo account** and a repository secret, neither of
which this repo can provision on its own:

1. Create a free account at https://expo.dev if you don't have one, then
   run `eas login` locally (installs nothing project-wide -- `npx eas-cli
   login` works too).
2. From `apps/mobile-template`, run `eas init` once. This registers the
   project with EAS and writes a real `extra.eas.projectId` into
   `app.json` -- commit that change.
3. Create an access token at https://expo.dev/accounts/[account]/settings/access-tokens
   and add it as the `EXPO_TOKEN` repository secret (Settings > Secrets
   and variables > Actions).

Until both exist, the `mobile-build` CI job runs and exits early with a
skip notice -- it never fails the build, and every other CI job (lint,
typecheck, unit/integration tests, e2e) is unaffected.

Once configured, each `main` push triggers a build; find the resulting
install link (or QR code) on the build's page at
https://expo.dev/accounts/[account]/projects/mobile-template/builds.
