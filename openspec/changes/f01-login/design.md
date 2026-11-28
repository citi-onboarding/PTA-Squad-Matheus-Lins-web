## Context

See `proposal.md` for motivation and `specs/auth/spec.md` for the behavior. Current state:

- The portal is the boilerplate: `/` renders an example home page, there is no feature yet, and `src/shared/testing/msw/handlers.ts` is empty.
- `createApiClient` already supports `getAuthHeaders` and `onUnauthorized`; `createBrowserApiClient` in `src/shared/lib/api/client.ts` only sets the base URL.
- Architecture rules: `src/app` → `src/features` → `src/shared`; shared code must not import a feature; components and hooks receive the `ApiClient` by injection.
- Backend contract (`f01-auth-api`): `POST /auth/login` → `{ token, user: { id, name, email, role } }`; `POST /auth/logout` → 204; `GET /auth/me` → `{ id, name, email, role }`; errors are RFC 9457 Problem Details. Backend ADR 0005 says the web keeps the token in memory with `sessionStorage` as the reload fallback, never `localStorage`, and discards it on any 401.

## Goals / Non-Goals

**Goals:**

- One place that owns the token, read by the transport and by the auth feature, without a shared → feature import.
- Route protection and role checks declared once in the router, reusable by every later page.
- Tests that drive the real router, components, and hooks, with MSW simulating only HTTP.

**Non-Goals:**

- Refreshing tokens or warning before the 8-hour idle expiry (the API decides; a 401 ends the session).
- Hiding navigation links per role (no navigation exists yet).
- Visual design beyond simple Tailwind classes.

## Decisions

### D1. Session token store in `src/shared/lib/auth/session-token.ts`

A small external store: `getSessionToken`, `setSessionToken`, `clearSessionToken`, and `subscribeSessionToken`. It keeps the token in a module variable and mirrors it to `sessionStorage` (key `distrilux.session-token`), reading `sessionStorage` once when the variable is empty, so a reload in the same tab keeps the session. `sessionStorage` access is wrapped in `try/catch`, so a blocked storage only loses the reload fallback.

- **Why shared:** `client.ts` (shared) must read the token for `getAuthHeaders`, and shared code cannot import a feature. The store holds no business logic, only the token, so it is genuinely shared.
- **Rejected: token in TanStack Query cache.** The cache is for server state, and the transport cannot read it without coupling to the query client.
- **Rejected: `localStorage`.** It survives closing the browser and is forbidden by backend ADR 0005.

### D2. Transport wiring in `client.ts`

`createBrowserApiClient` defaults `getAuthHeaders` to `{ Authorization: "Bearer <token>" }` when a token exists, and `onUnauthorized` to `clearSessionToken()`. Callers can still override both. Clearing the token notifies subscribers, which is how the UI learns the session ended (D4), so the transport never touches the router.

### D3. API client provided by context

`src/shared/lib/api/api-client-context.tsx` exposes `ApiClientProvider` and `useApiClient`. `src/app/providers.tsx` creates one browser client and provides it. Hooks read it from the context and pass it to `api/*.ts` functions, keeping the injection pattern. Tests provide a client pointing at the MSW base URL.

### D4. Feature `src/features/auth`

- `types/auth.ts`: Zod schemas `authUserSchema` (role enum `SELLER | MANAGER | FINANCE | ADMIN`) and `loginResponseSchema`.
- `api/login.ts`, `api/logout.ts`, `api/me.ts`: call the injected client; logout uses a schema that accepts an empty body.
- `queries/session-query.ts`: `sessionQueryOptions(client, token)` with key `["auth", "session", token]`, so a new token never reuses another session's cache; `retry: false`, because a 401 must not be retried.
- `lib/role-access.ts`: `homePathFor(role)` and the page access matrix from PRD 4.2.
- `hooks/use-session-token.ts`: `useSyncExternalStore` over the D1 store.
- `hooks/use-sign-in.ts` / `hooks/use-sign-out.ts`: TanStack Query mutations. Sign-in stores the token and seeds the session query; sign-out calls the API, then always clears the token and removes the session queries, even if the API call fails.
- `components/sign-in-page.tsx`: the form. The error alert has `role="alert"`; the email stays in component state; the button is disabled while the mutation is pending.
- `components/protected-layout.tsx`: without a token, redirects to `/entrar` with the current location in router state; with a token, waits for `/auth/me`, then renders a header with the user's name and "Sair", and an `<Outlet />`.
- `components/require-role.tsx`: renders the page or `"Você não tem acesso a esta página"`.
- `components/role-home-redirect.tsx`: sends `/` to `homePathFor(role)`.

After sign-in, the page goes to `location.state.from` when it is an internal path (starts with `/`, not `//`), otherwise to the role's home page. This avoids an open redirect. The check lives in `lib/return-path.ts`.

Only a 401 shows `"E-mail ou senha incorretos"`; any other sign-in failure (server error, no connection) shows `"Não foi possível entrar agora. Tente novamente."`, so a backend outage is not mistaken for a wrong password. Likewise, a session check that fails without a 401 keeps the token and asks for a reload. Both cases were added to the spec during Green.

### D5. Router in `src/app/router.tsx`

`/entrar` is public. A pathless route with the protected layout wraps `/` (role home redirect), `/clientes`, `/painel`, `/contratos`, and `/admin`, each wrapped in `RequireRole` with its allowed roles. Each page is `UnderConstructionPage` in `src/app/routes/`, which shows the page title and `"Em construção"`. The boilerplate `home-page.tsx` is removed. Sign-out navigates with `replace`, and because the protected layout rechecks the token on every render, going back shows `/entrar`.

### D6. Tests

- Vitest + Testing Library render the real `routes` in a memory router inside the real providers, with MSW handlers for `/auth/*` and request assertions (Authorization header). Shared handlers live in `src/shared/testing/msw/handlers.ts` only when generic; auth handlers stay in the feature tests.
- Playwright + axe (`e2e/auth.spec.ts`) runs against the built preview with `page.route` answering `/auth/*`, because the e2e web server does not start the backend. It covers sign-in and sign-out with the keyboard at 390 × 844 and desktop, checks axe and the absence of horizontal scroll.
- The manual check against the real local API with seeded users covers the integration.

### D7. ADR

Not needed in this repository. The token storage decision is cross-cutting but already recorded in backend ADR 0005, which this change follows; the route protection pattern is local to the router and reversible. The change summary records this evaluation.

## Risks / Trade-offs

- [A token in `sessionStorage` can be read by an injected script] → React escaping, no `dangerouslySetInnerHTML`, and the token is never logged; the backend ADR accepts this trade-off.
- [Role checks in the browser can be bypassed] → they only hide pages; every API route enforces roles (RN-08).
- [The e2e test does not hit the real API] → the manual check against the local backend and the backend's own integration tests cover the contract.
- [Removing the boilerplate home page changes two existing example tests] → they are updated in this change; confirmed by the user.
