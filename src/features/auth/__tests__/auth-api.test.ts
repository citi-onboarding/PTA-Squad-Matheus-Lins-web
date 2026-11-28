import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { createApiClient } from "@/shared/lib/api/create-client";
import { ApiContractError } from "@/shared/lib/api/errors";
import { server } from "@/shared/testing/msw/server";

import { login } from "../api/login";
import { logout } from "../api/logout";
import { getMe } from "../api/me";

const API = "http://localhost:3001";
// Created per call: a client built at import time would capture `fetch`
// before MSW starts intercepting it and reach the real network.
const client = () => createApiClient({ baseUrl: API });
const manager = {
  id: 1,
  name: "Fernanda Cavalcanti",
  email: "fernanda.cavalcanti@distrilux.test",
  role: "MANAGER",
};

describe("F01 / US-001 auth API calls", () => {
  it("posts the credentials to /auth/login and returns the token and user", async () => {
    let received: unknown;
    server.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ token: "token-123", user: manager });
      }),
    );

    await expect(
      login(client(), { email: manager.email, password: "secret" }),
    ).resolves.toEqual({ token: "token-123", user: manager });
    expect(received).toEqual({ email: manager.email, password: "secret" });
  });

  it("rejects a login response outside the contract", async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({
          token: "token-123",
          user: { ...manager, role: "OWNER" },
        }),
      ),
    );

    await expect(
      login(client(), { email: manager.email, password: "secret" }),
    ).rejects.toBeInstanceOf(ApiContractError);
  });

  it("reads the signed-in user from /auth/me", async () => {
    server.use(http.get(`${API}/auth/me`, () => HttpResponse.json(manager)));

    await expect(getMe(client())).resolves.toEqual(manager);
  });

  it("posts to /auth/logout and accepts the empty 204 answer", async () => {
    let called = false;
    server.use(
      http.post(`${API}/auth/logout`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(logout(client())).resolves.toBeUndefined();
    expect(called).toBe(true);
  });
});
