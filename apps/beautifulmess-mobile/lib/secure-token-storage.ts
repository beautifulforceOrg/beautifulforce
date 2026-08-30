import * as SecureStore from "expo-secure-store";
import type { TokenStorage } from "@storeforge/api-client";

// SecureStore, not AsyncStorage -- this holds a session credential, per
// the plan's Phase 3 auth design. Every client app's own createStorefrontApiClient
// call gets its own key, so multiple storefront apps on one device never
// collide (though in the per-storefront-binary model, only one ever runs).
const TOKEN_KEY = "storeforge_session_token";

export function createSecureTokenStorage(): TokenStorage {
  return {
    async getToken() {
      return SecureStore.getItemAsync(TOKEN_KEY);
    },
    async setToken(token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    },
    async clearToken() {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    },
  };
}
