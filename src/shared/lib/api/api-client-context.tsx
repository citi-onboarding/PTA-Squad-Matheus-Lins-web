import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import type { ApiClient } from "./create-client";

const ApiClientContext = createContext<ApiClient | null>(null);

type ApiClientProviderProps = {
  client: ApiClient;
  children: ReactNode;
};

export function ApiClientProvider({
  client,
  children,
}: ApiClientProviderProps) {
  return (
    <ApiClientContext.Provider value={client}>
      {children}
    </ApiClientContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider.
export function useApiClient(): ApiClient {
  const client = useContext(ApiClientContext);
  if (!client)
    throw new Error("useApiClient must be used inside ApiClientProvider.");
  return client;
}
