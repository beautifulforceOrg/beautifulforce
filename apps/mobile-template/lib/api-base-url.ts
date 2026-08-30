// EXPO_PUBLIC_-prefixed env vars are inlined into the client bundle by
// Expo/Metro; each client app overrides this at build/run time to point at
// its own apps/<client> deployment (isolation model, per CLAUDE.md) -- the
// default here is only for local development against apps/beautifulmess.
export function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
}
