import { z } from "zod";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearSessionToken,
  getSessionToken,
  setSessionToken,
} from "../auth/session-token";
import { createBrowserApiClient } from "./client";

afterEach(() => {
  clearSessionToken();
  sessionStorage.clear();
});

describe("createBrowserApiClient", () => {
  it("F01 / US-001 sends the session token as a Bearer header", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ ok: true }));
    setSessionToken("token-123");
    const client = createBrowserApiClient({ fetch: fetchMock });

    await client.request("status", { schema: z.object({ ok: z.boolean() }) });

    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer token-123");
  });

  it("F01 / US-001 sends no Authorization header without a session", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ ok: true }));
    const client = createBrowserApiClient({ fetch: fetchMock });

    await client.request("status", { schema: z.object({ ok: z.boolean() }) });

    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.has("Authorization")).toBe(false);
  });

  it("F01 / US-001 discards the session on any 401", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ status: 401 }, { status: 401 }));
    setSessionToken("expired-token");
    const client = createBrowserApiClient({ fetch: fetchMock });

    await expect(
      client.request("status", { schema: z.object({ ok: z.boolean() }) }),
    ).rejects.toMatchObject({ status: 401 });
    expect(getSessionToken()).toBeNull();
  });

  it("uses the validated public API URL by default", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ ok: true }));
    const client = createBrowserApiClient({ fetch: fetchMock });

    await client.request("status", { schema: z.object({ ok: z.boolean() }) });

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "http://localhost:3001/status",
    );
  });
});
