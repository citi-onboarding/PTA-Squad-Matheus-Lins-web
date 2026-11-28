import type { ApiClient } from "@/shared/lib/api/create-client";

import { authUserSchema } from "../types/auth";
import type { AuthUser } from "../types/auth";

export function getMe(client: ApiClient): Promise<AuthUser> {
  return client.request("auth/me", { schema: authUserSchema });
}
