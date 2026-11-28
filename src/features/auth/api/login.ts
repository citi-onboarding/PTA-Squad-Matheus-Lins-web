import type { ApiClient } from "@/shared/lib/api/create-client";

import { loginResponseSchema } from "../types/auth";
import type { Credentials, LoginResponse } from "../types/auth";

export function login(
  client: ApiClient,
  credentials: Credentials,
): Promise<LoginResponse> {
  return client.request("auth/login", {
    method: "POST",
    body: credentials,
    schema: loginResponseSchema,
  });
}
