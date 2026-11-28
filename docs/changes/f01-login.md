---
change_id: f01-login
date: 2026-11-28
status: in-progress
owners: [thiagoac07]
tags: [f01, us-001, rn-08, rn-14, auth]
related_adrs: []
openspec_change: openspec/changes/f01-login/
---

# Sign-in page and protected routes in the portal

## Objective

Complete US-001 in the browser: users sign in, land on their role's home page, are stopped on pages their role cannot open, and sign out (F01, US-001, RN-08, RN-14).

## Change made

- **Feature `src/features/auth`:**
  - Zod schemas mirroring the backend contract;
  - `api/login.ts`, `api/logout.ts`, and `api/me.ts`, each receiving the `ApiClient` by injection;
  - the `/auth/me` session query, keyed by token, without retries;
  - the role access matrix from PRD 4.2 and the return-path guard;
  - sign-in, sign-out, and session hooks;
  - the components `SignInPage`, `ProtectedLayout`, `RequireRole`, `RoleHomeRedirect`, and `SignOutButton`.
- **Shared:**
  - `src/shared/lib/auth/session-token.ts`: the token store, in memory with `sessionStorage` as the reload fallback;
  - `src/shared/lib/api/api-client-context.tsx`: provides the API client to components;
  - `createBrowserApiClient` now sends `Authorization: Bearer <token>` and clears the token on any 401 by default.
- **App:**
  - `src/app/router.tsx`: `/entrar` is public. A protected layout wraps `/`, `/clientes`, `/painel`, `/contratos`, and `/admin`, and each page is role-gated.
  - `src/app/routes/under-construction-page.tsx`: the provisional pages.
  - `src/app/providers.tsx`: provides one browser API client.
- **Removed:** the boilerplate example home page (`src/app/routes/home-page.tsx`). Its three example tests (`router.test.tsx`, `providers.test.tsx`, and `e2e/application.spec.ts`) were updated for the new `/`.
- **Spec additions during Green:**
  - a sign-in failure other than 401 shows `"Não foi possível entrar agora. Tente novamente."`;
  - a failed session check without a 401 keeps the token and asks for a reload.

## Resulting behavior

- Valid sign-in on `/entrar` opens `/clientes` (seller), `/painel` (manager, finance), or `/admin` (admin).
- Sign-in errors:
  - a wrong email or password shows `"E-mail ou senha incorretos"` in a `role="alert"`, keeping the typed email;
  - a backend outage shows a different message;
  - "Entrar" is disabled while the request is in flight.
- Sessions:
  - without a session, any internal page goes to `/entrar`, and after signing in the user returns to that page;
  - only internal paths are accepted, so sign-in cannot become an open redirect;
  - `/` opens the role's home page.
- Roles: a seller on `/painel` or `/contratos` sees `"Você não tem acesso a esta página"`; a manager opens `/contratos`.
- Session end:
  - any 401 discards the token and shows `/entrar`;
  - "Sair" calls `POST /auth/logout`, discards the token, and shows `/entrar`, and going back does not reopen an internal page.
- Token:
  - kept in memory and `sessionStorage`, never in `localStorage`, a `VITE_*` value, or a log;
  - a reload in the same tab keeps the session.
- Accessibility and layout:
  - labelled fields, keyboard sign-in and sign-out, no axe violations, and no horizontal scroll at 390 px and on desktop;
  - provisional pages show `"Em construção"`.

## Impact

- **API:** no backend change; consumes `POST /auth/login`, `POST /auth/logout`, and `GET /auth/me` from backend change `f01-auth-api`.
- **Later features:** new pages are added inside the protected layout with `rolePage(path, page, title)` or `RequireRole`, and inherit the session and role checks. Feature hooks read the API client with `useApiClient()`.
- **Security:** browser role checks only reflect the API's authorization (RN-08). The token is readable by scripts in the page, a trade-off accepted in backend ADR 0005.
- **Risks:** none beyond those in the design.
- **Local environment notes (not part of the code):**
  - Node 25+ defines its own empty `localStorage`, which hides jsdom's. Tests that use `localStorage` then fail locally unless run with `NODE_OPTIONS=--no-experimental-webstorage`. The project and CI use Node 22, where this does not happen.
  - A project folder inside OneDrive can lock `node_modules` files during sync (`EBUSY`).

## Validations executed

| Command                                                                                                                      | Result                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm exec openspec validate f01-login --strict`                                                                             | `Change 'f01-login' is valid`                                                                                                                                                                                                                                                                                                                                                                |
| Red: `pnpm test`, `pnpm test:e2e`                                                                                            | 37 new unit tests and 3 e2e tests failed on assertions before production code; the 3 passing unit tests were negative cases satisfied by the stubs                                                                                                                                                                                                                                           |
| `pnpm verify` (typecheck, lint, tests, `openspec validate --all --strict`, skills check)                                     | exit code 0; `Test Files 20 passed (20)`, `Tests 101 passed (101)`; `Totals: 1 passed, 0 failed`                                                                                                                                                                                                                                                                                             |
| `pnpm test:coverage`                                                                                                         | `Tests 101 passed (101)`; all files 97.82% statements, 95.61% branches; `src/shared/lib/**` thresholds met                                                                                                                                                                                                                                                                                   |
| `pnpm test:e2e`                                                                                                              | `5 passed`: sign-in and sign-out with the keyboard at 390 px and desktop, axe with no violations, no horizontal scroll, plus the 3 boilerplate checks                                                                                                                                                                                                                                        |
| `pnpm build`                                                                                                                 | exit code 0                                                                                                                                                                                                                                                                                                                                                                                  |
| `pnpm format:check`                                                                                                          | All 39 files of this change pass `prettier --check`. On this Windows checkout the full command reports 57 pre-existing files that are CRLF only in the working tree (`git ls-files --eol`: `i/lf w/crlf`); none belong to this change.                                                                                                                                                       |
| Manual check against the real local API (backend `main` in Docker, `pnpm sync:erp` and `pnpm db:seed`, portal on `pnpm dev`) | 14 of 14 checks passed in Chromium: each role lands on its home page; wrong password and unknown email show the same message and keep the email; a visitor on `/painel` goes to `/entrar`; a seller is denied `/painel` and `/contratos`; the token is in `sessionStorage` and not in `localStorage`; Sair leads to `/entrar`, back stays out, and the API rejects the old token with 401    |
| Manual check at 390 × 844, keyboard only, against the same real local API                                                    | 20 of 20 checks passed in Chromium: Tab order reaches E-mail, Senha, and Sair; wrong password shows the message and keeps the email; the seller signs in with Enter and lands on `/clientes`; the seller is denied `/painel` and `/contratos`; Enter on Sair leads to `/entrar` and back stays out; no horizontal scroll and no axe violations on the sign-in, error, home, and denied pages |

Twice during local runs, Vitest reported "Unhandled Error" and ran fewer test files, together with an OneDrive `EBUSY` lock in one of them. It did not reproduce in five later runs, and CI runs outside OneDrive.

## Related artifacts

- Proposal: `openspec/changes/f01-login/proposal.md`
- Specification: `openspec/changes/f01-login/specs/auth/spec.md`
- Design: `openspec/changes/f01-login/design.md`
- Tasks: `openspec/changes/f01-login/tasks.md`
- ADR: Not applicable. The cross-cutting decision, where the web keeps the session token, is already recorded in backend ADR 0005 (`PTA-Squad-Matheus-Lins-Backend/docs/adr/0005-session-authentication.md`), and this change follows it. Route protection and role gating are local to the portal router and reversible.

## Usage

1. Run the backend (`docker compose up -d --build` in the backend), then `pnpm sync:erp` and `pnpm db:seed` there.
2. In this repository, run `pnpm dev` and open `http://localhost:5173`. You are sent to `/entrar`.
3. Sign in with a seeded user, for example `fernanda.cavalcanti@distrilux.test` and the backend's `SEED_DEFAULT_PASSWORD`.
4. To add a protected page, add `rolePage("path", "<page>", "Title")` in `src/app/router.tsx` after adding the page to the matrix in `src/features/auth/lib/role-access.ts`.

## Implementation notes

- A test that builds an `ApiClient` at import time captures `fetch` before MSW starts intercepting and reaches the real network. Build clients inside each test.
- The backend allows the portal origin `http://localhost:5173` by default (`CORS_ORIGINS`). The `pnpm preview` port 4173 is not allowed, so manual checks against the real API use `pnpm dev`.
- Seller users now come from synced customers (backend change `f01-auth-api` after review), so `pnpm db:seed` requires `pnpm sync:erp` first.
