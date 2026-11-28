import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ApiClientProvider } from "@/shared/lib/api/api-client-context";
import { createBrowserApiClient } from "@/shared/lib/api/client";
import {
  clearSessionToken,
  getSessionToken,
  SESSION_TOKEN_STORAGE_KEY,
  setSessionToken,
} from "@/shared/lib/auth/session-token";
import { server } from "@/shared/testing/msw/server";

import { routes } from "./router";

const API = "http://localhost:3001";
const PASSWORD = "test-password";

const users = {
  SELLER: {
    id: 4,
    name: "Carla Nogueira",
    email: "carla.nogueira@distrilux.test",
    role: "SELLER",
  },
  MANAGER: {
    id: 1,
    name: "Fernanda Cavalcanti",
    email: "fernanda.cavalcanti@distrilux.test",
    role: "MANAGER",
  },
  FINANCE: {
    id: 2,
    name: "Sérgio Barros",
    email: "sergio.barros@distrilux.test",
    role: "FINANCE",
  },
  ADMIN: {
    id: 3,
    name: "Lucas Moura",
    email: "lucas.moura@distrilux.test",
    role: "ADMIN",
  },
} as const;
type RoleName = keyof typeof users;

const unauthorized = {
  type: "about:blank",
  title: "Unauthorized",
  status: 401,
  detail: "E-mail ou senha incorretos",
  instance: "/auth/login",
};

/** Records what the simulated API received. */
const api = {
  meAuthorization: [] as (string | null)[],
  logoutAuthorization: [] as (string | null)[],
};

function tokenFor(role: RoleName) {
  return `token-${role}`;
}

function userForAuthorization(header: string | null) {
  return Object.values(users).find(
    (user) => header === `Bearer ${tokenFor(user.role)}`,
  );
}

beforeEach(() => {
  api.meAuthorization = [];
  api.logoutAuthorization = [];
  server.use(
    http.post(`${API}/auth/login`, async ({ request }) => {
      const body = (await request.json()) as {
        email: string;
        password: string;
      };
      const user = Object.values(users).find(
        (candidate) => candidate.email === body.email,
      );
      if (!user || body.password !== PASSWORD)
        return HttpResponse.json(unauthorized, { status: 401 });
      return HttpResponse.json({ token: tokenFor(user.role), user });
    }),
    http.get(`${API}/auth/me`, ({ request }) => {
      const header = request.headers.get("Authorization");
      api.meAuthorization.push(header);
      const user = userForAuthorization(header);
      return user
        ? HttpResponse.json(user)
        : HttpResponse.json(
            { ...unauthorized, instance: "/auth/me" },
            { status: 401 },
          );
    }),
    http.post(`${API}/auth/logout`, ({ request }) => {
      api.logoutAuthorization.push(request.headers.get("Authorization"));
      return new HttpResponse(null, { status: 204 });
    }),
  );
});

afterEach(() => {
  clearSessionToken();
  sessionStorage.clear();
  localStorage.clear();
});

function renderApp(path: string) {
  const client = createBrowserApiClient({ baseUrl: API });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={queryClient}>
      <ApiClientProvider client={client}>
        <RouterProvider router={router} />
      </ApiClientProvider>
    </QueryClientProvider>,
  );
  return { router, user: userEvent.setup() };
}

async function signIn(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  password = PASSWORD,
) {
  await user.type(await screen.findByLabelText("E-mail"), email);
  await user.type(screen.getByLabelText("Senha"), password);
  await user.click(screen.getByRole("button", { name: "Entrar" }));
}

async function expectPath(
  router: ReturnType<typeof createMemoryRouter>,
  path: string,
) {
  await waitFor(() => expect(router.state.location.pathname).toBe(path));
}

describe("F01 / US-001 sign-in", () => {
  it.each([
    ["SELLER", "/clientes", "Clientes"],
    ["MANAGER", "/painel", "Painel"],
    ["FINANCE", "/painel", "Painel"],
    ["ADMIN", "/admin", "Administração"],
  ] as const)(
    "sends a %s to %s after a valid sign-in",
    async (role, path, heading) => {
      const { router, user } = renderApp("/entrar");

      await signIn(user, users[role].email);

      await expectPath(router, path);
      expect(
        await screen.findByRole("heading", { level: 1, name: heading }),
      ).toBeInTheDocument();
    },
  );

  it("shows the announced error and keeps the email on wrong credentials", async () => {
    const { router, user } = renderApp("/entrar");

    await signIn(user, users.MANAGER.email, "wrong-password");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-mail ou senha incorretos",
    );
    expect(screen.getByLabelText("E-mail")).toHaveValue(users.MANAGER.email);
    expect(router.state.location.pathname).toBe("/entrar");
    expect(getSessionToken()).toBeNull();
  });

  it("shows a different message and keeps the email when the API is unavailable", async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );
    const { user } = renderApp("/entrar");

    await signIn(user, users.MANAGER.email);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível entrar agora. Tente novamente.",
    );
    expect(screen.getByLabelText("E-mail")).toHaveValue(users.MANAGER.email);
  });

  it("disables the Entrar button while the sign-in is in flight", async () => {
    let answer: () => void = () => {};
    server.use(
      http.post(
        `${API}/auth/login`,
        () =>
          new Promise<Response>((resolve) => {
            answer = () =>
              resolve(
                HttpResponse.json({
                  token: tokenFor("MANAGER"),
                  user: users.MANAGER,
                }),
              );
          }),
      ),
    );
    const { router, user } = renderApp("/entrar");

    await signIn(user, users.MANAGER.email);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Entrar" })).toBeDisabled(),
    );
    answer();
    await expectPath(router, "/painel");
  });

  it("keeps the token in sessionStorage and never in localStorage", async () => {
    const { router, user } = renderApp("/entrar");

    await signIn(user, users.SELLER.email);
    await expectPath(router, "/clientes");

    expect(sessionStorage.getItem(SESSION_TOKEN_STORAGE_KEY)).toBe(
      tokenFor("SELLER"),
    );
    expect(JSON.stringify({ ...localStorage })).not.toContain(
      tokenFor("SELLER"),
    );
  });
});

describe("F01 / US-001 internal pages require a session", () => {
  it("sends a visitor from an internal page to /entrar", async () => {
    const { router } = renderApp("/painel");

    await expectPath(router, "/entrar");
    expect(await screen.findByLabelText("E-mail")).toBeInTheDocument();
  });

  it("sends a visitor from / to /entrar", async () => {
    const { router } = renderApp("/");

    await expectPath(router, "/entrar");
  });

  it("returns to the requested page after signing in", async () => {
    const { router, user } = renderApp("/contratos");
    await expectPath(router, "/entrar");

    await signIn(user, users.MANAGER.email);

    await expectPath(router, "/contratos");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Contratos" }),
    ).toBeInTheDocument();
  });

  it("sends a signed-in user from / to their role's home page", async () => {
    setSessionToken(tokenFor("SELLER"));
    const { router } = renderApp("/");

    await expectPath(router, "/clientes");
  });

  it("keeps the session after a reload in the same tab", async () => {
    sessionStorage.setItem(SESSION_TOKEN_STORAGE_KEY, tokenFor("FINANCE"));
    const { router } = renderApp("/painel");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Painel" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/painel");
    expect(api.meAuthorization).toContain(`Bearer ${tokenFor("FINANCE")}`);
  });
});

describe("F01 / US-001 / RN-08 role access", () => {
  it.each(["/painel", "/contratos"])(
    "shows the access denied message to a seller on %s",
    async (path) => {
      setSessionToken(tokenFor("SELLER"));
      renderApp(path);

      expect(
        await screen.findByText("Você não tem acesso a esta página"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { level: 1, name: /Painel|Contratos/ }),
      ).not.toBeInTheDocument();
    },
  );

  it("lets a manager open the contracts page", async () => {
    setSessionToken(tokenFor("MANAGER"));
    renderApp("/contratos");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Contratos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Em construção")).toBeInTheDocument();
  });
});

describe("F01 / US-001 session end", () => {
  it("discards the session and shows /entrar when the API answers 401", async () => {
    setSessionToken("expired-token");
    const { router } = renderApp("/clientes");

    await expectPath(router, "/entrar");
    expect(getSessionToken()).toBeNull();
  });

  it("keeps the token and shows an alert when the session check fails without a 401", async () => {
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ status: 500 }, { status: 500 }),
      ),
    );
    setSessionToken(tokenFor("SELLER"));
    renderApp("/clientes");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar sua sessão. Recarregue a página.",
    );
    expect(getSessionToken()).toBe(tokenFor("SELLER"));
  });

  it("signs out through the API, discards the token, and stays out after going back", async () => {
    const { router, user } = renderApp("/entrar");
    await signIn(user, users.SELLER.email);
    await expectPath(router, "/clientes");

    await user.click(await screen.findByRole("button", { name: "Sair" }));

    await expectPath(router, "/entrar");
    expect(api.logoutAuthorization).toEqual([`Bearer ${tokenFor("SELLER")}`]);
    expect(getSessionToken()).toBeNull();

    await router.navigate(-1);

    await expectPath(router, "/entrar");
  });
});
