import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { ApiClientProvider, useApiClient } from "./api-client-context";
import { createApiClient } from "./create-client";

describe("ApiClientProvider", () => {
  it("gives components the injected API client", () => {
    const client = createApiClient({ baseUrl: "http://localhost:3001" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ApiClientProvider client={client}>{children}</ApiClientProvider>
    );

    const { result } = renderHook(() => useApiClient(), { wrapper });

    expect(result.current).toBe(client);
  });

  it("fails clearly when used outside the provider", () => {
    expect(() => renderHook(() => useApiClient())).toThrow(
      "useApiClient must be used inside ApiClientProvider.",
    );
  });
});
