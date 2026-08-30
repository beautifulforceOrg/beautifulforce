import { createStorefrontApiClient } from "@storeforge/api-client";
import { getApiBaseUrl } from "./api-base-url";
import { createSecureTokenStorage } from "./secure-token-storage";

// A single client instance for the app's lifetime -- its token storage is
// backed by SecureStore, so a logged-in session survives an app restart
// with no extra code (see secure-token-storage.ts).
export const apiClient = createStorefrontApiClient(getApiBaseUrl(), createSecureTokenStorage());
