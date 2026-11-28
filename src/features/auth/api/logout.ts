import { z } from "zod";

import type { ApiClient } from "@/shared/lib/api/create-client";

/** The backend answers 204 with an empty body. */
const emptyResponseSchema = z.undefined();

export async function logout(client: ApiClient): Promise<void> {
  await client.request("auth/logout", {
    method: "POST",
    schema: emptyResponseSchema,
  });
}
