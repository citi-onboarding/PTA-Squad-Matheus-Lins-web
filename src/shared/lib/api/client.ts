import {
  clearSessionToken,
  getSessionToken,
} from "@/shared/lib/auth/session-token";
import { env } from "@/shared/lib/env/env";

import { createApiClient } from "./create-client";
import type { ApiClientConfig } from "./create-client";

type BrowserApiClientConfig = Omit<ApiClientConfig, "baseUrl"> & {
  baseUrl?: string;
};

/** Sends the session token as a Bearer header, when there is one. */
function sessionAuthHeaders(): HeadersInit {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function createBrowserApiClient(config: BrowserApiClientConfig = {}) {
  return createApiClient({
    getAuthHeaders: sessionAuthHeaders,
    // Any 401 ends the session; the UI reacts to the cleared token.
    onUnauthorized: clearSessionToken,
    ...config,
    baseUrl: config.baseUrl ?? env.VITE_API_URL,
  });
}
