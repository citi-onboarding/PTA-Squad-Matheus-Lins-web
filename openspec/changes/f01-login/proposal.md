## Why

The backend now has sign-in, sessions, and role checks (backend change `f01-auth-api`, ADR 0005), but the portal has no sign-in page and no page protection: anyone opens any route. US-001 is complete only when a user signs in through the web, lands on the home page of their role, is stopped where their role has no access, and can sign out (F01, US-001, RN-08, RN-14).

## What Changes

- A sign-in page at `/entrar` with labelled email and password fields. Valid credentials lead to the role's home page: seller → `/clientes`, manager and finance → `/painel`, admin → `/admin`.
- A failed sign-in shows `"E-mail ou senha incorretos"` in an alert that screen readers announce, and keeps the typed email. The submit button is disabled while the request is in flight.
- Every internal page requires a session. A visitor without one goes to `/entrar` and, after signing in, returns to the page they tried to open. `/` sends a signed-in user to their role's home page.
- Page access follows PRD section 4.2: `/clientes` for seller, manager, and finance; `/painel` for manager and finance; `/contratos` for manager; `/admin` for admin. Any other role sees `"Você não tem acesso a esta página"`. The API still enforces authorization (RN-08); the page only reflects it.
- Any 401 from the API ends the session and leads to `/entrar`.
- A Sair button calls `POST /auth/logout`, discards the token, and leads to `/entrar`. Going back in the browser does not reopen an internal page.
- The token is kept in memory with `sessionStorage` as the reload fallback, as ADR 0005 of the backend defines. It is never put in `localStorage`, in a `VITE_*` value, or in a log. Every API call sends it as `Authorization: Bearer <token>`.
- Provisional home pages show `"Em construção"`.
- The boilerplate example home page is removed, because `/` now redirects.

### Out of scope

- Final visual design (design system arrives in sprint 2).
- Password recovery.
- Content of the role home pages, customers, dashboard, contracts, and admin screens.
- Sign-in in the mobile app (sprint 2).
- Any backend change.

## Capabilities

### New Capabilities

- `auth`: signing in and out of the portal, keeping the session, protecting internal pages, sending each role to its home page, and denying pages a role cannot open.

### Modified Capabilities

None.

## Impact

- **Business:** completes the five US-001 acceptance criteria in the browser. Later screens are added inside the protected layout and inherit the session and role checks.
- **Security:** the token lives only in memory and `sessionStorage` (cleared when the tab closes), never in public config or logs. A 401 always discards it. Role checks in the browser are a convenience; the API remains the authority (RN-08). The portal calls only the backend (RN-14).
- **API contract:** consumes the existing `POST /auth/login`, `POST /auth/logout`, and `GET /auth/me` without changes. Responses are validated with Zod at the feature boundary.
- **Accessibility:** labelled fields, full keyboard use, AA contrast, no horizontal scroll at 390 px, and axe checks in Playwright.
- **Repository:** new feature `src/features/auth`; shared session-token store and API client provider in `src/shared/lib`; new routes in `src/app/router.tsx`; the boilerplate home page and its tests are replaced.
- **Dependencies:** none added.
