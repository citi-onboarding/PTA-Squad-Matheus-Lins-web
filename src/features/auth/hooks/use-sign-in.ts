import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/shared/lib/api/api-client-context";
import { setSessionToken } from "@/shared/lib/auth/session-token";

import { login } from "../api/login";
import { sessionQueryOptions } from "../queries/session-query";
import type { Credentials } from "../types/auth";

export function useSignIn() {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: Credentials) => login(client, credentials),
    onSuccess: ({ token, user }) => {
      // Seed the session so the first internal page needs no extra request.
      queryClient.setQueryData(
        sessionQueryOptions(client, token).queryKey,
        user,
      );
      setSessionToken(token);
    },
  });
}
