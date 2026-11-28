import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";
import { RouterProvider } from "react-router-dom";

import { ApiClientProvider } from "@/shared/lib/api/api-client-context";
import { createBrowserApiClient } from "@/shared/lib/api/client";
import { createQueryClient } from "@/shared/lib/query/create-query-client";

import { router } from "./router";

export function AppProviders() {
  const [queryClient] = useState(createQueryClient);
  const [apiClient] = useState(() => createBrowserApiClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ApiClientProvider client={apiClient}>
        <RouterProvider router={router} />
      </ApiClientProvider>
      {import.meta.env.DEV ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
