// Pluggable so this package stays usable from both mobile and web with
// zero RN/DOM-specific code (per the plan) -- apps/mobile-template supplies
// an expo-secure-store-backed implementation; anything else (tests, a
// future web consumer) can use the in-memory default.
export interface TokenStorage {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
}

export function createInMemoryTokenStorage(): TokenStorage {
  let token: string | null = null;
  return {
    async getToken() {
      return token;
    },
    async setToken(next) {
      token = next;
    },
    async clearToken() {
      token = null;
    },
  };
}
