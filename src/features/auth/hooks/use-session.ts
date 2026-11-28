import { useQuery } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import { useApiClient } from "@/shared/lib/api/api-client-context";
import {
  getSessionToken,
  subscribeSessionToken,
} from "@/shared/lib/auth/session-token";

import { sessionQueryOptions } from "../queries/session-query";

/** The current token; re-renders when it is set or discarded (e.g. on a 401). */
export function useSessionToken(): string | null {
  return useSyncExternalStore(subscribeSessionToken, getSessionToken);
}

/** The signed-in user from `GET /auth/me`, only while a token exists. */
export function useSession() {
  const client = useApiClient();
  const token = useSessionToken();
  const query = useQuery({
    ...sessionQueryOptions(client, token ?? ""),
    enabled: token !== null,
  });
  return { token, ...query };
}
