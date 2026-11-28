import { queryOptions } from "@tanstack/react-query";

import type { ApiClient } from "@/shared/lib/api/create-client";

import { getMe } from "../api/me";

export const sessionQueryKeyRoot = ["auth", "session"] as const;

/** Keyed by token, so a new session never reuses another session's user. */
export function sessionQueryOptions(client: ApiClient, token: string) {
  return queryOptions({
    queryKey: [...sessionQueryKeyRoot, token],
    queryFn: () => getMe(client),
    // A 401 must end the session, not be retried.
    retry: false,
    staleTime: Infinity,
  });
}
