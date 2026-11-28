import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useApiClient } from "@/shared/lib/api/api-client-context";
import { clearSessionToken } from "@/shared/lib/auth/session-token";

import { logout } from "../api/logout";
import { sessionQueryKeyRoot } from "../queries/session-query";

export function useSignOut() {
  const client = useApiClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logout(client),
    // The local session ends even when the API call fails.
    onSettled: () => {
      clearSessionToken();
      queryClient.removeQueries({ queryKey: sessionQueryKeyRoot });
    },
  });
}
