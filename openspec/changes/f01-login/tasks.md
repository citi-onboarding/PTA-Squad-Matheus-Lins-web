## 1. SDD

- [x] 1.1 Write proposal, auth spec, design, and tasks for F01 web (US-001, RN-08, RN-14)
- [x] 1.2 Run `pnpm exec openspec validate f01-login --strict`

## 2. Red

- [x] 2.1 Scaffold the feature with `pnpm gen:feature auth` and replace the generated example files with the auth structure
- [x] 2.2 Developer writes the unit tests: session-token store (memory, `sessionStorage`, never `localStorage`); browser API client (Bearer header, 401 clears the token); `api/login`, `api/logout`, `api/me` with Zod validation
- [x] 2.3 Developer writes the flow tests with MSW and the real router: sign-in per role (4 cases); wrong credentials keep the email and show the alert; button disabled while sending; internal page without session redirects and returns after sign-in; root redirects to the role home; seller denied on `/painel` and `/contratos`, manager allowed on `/contratos`; 401 ends the session; sign-out clears the token, redirects, and back does not reopen; reload keeps the session
- [x] 2.4 Developer writes `e2e/auth.spec.ts` (Playwright + axe, keyboard sign-in and sign-out at 390 px and desktop, no horizontal scroll) and updates the boilerplate router and e2e tests for the new `/`
- [x] 2.5 Add stubs with the final signatures so tests fail on assertions, not on imports
- [x] 2.6 Run `pnpm test` and confirm the new tests fail

## 3. Green

- [x] 3.1 Implement the session-token store, the API client defaults, and the API client provider
- [x] 3.2 Implement the auth types, API calls, session query, role access, and hooks
- [x] 3.3 Implement the sign-in page, protected layout, role gate, root redirect, sign-out, and router with provisional pages; remove the boilerplate home page
- [x] 3.4 Run `pnpm test` and `pnpm test:e2e` and confirm every test passes

## 4. Refactor

- [x] 4.1 Remove duplication and clarify names without changing behavior
- [x] 4.2 Run `pnpm test` and confirm the suite stays green

## 5. Consolidation

- [x] 5.1 Check the five US-001 criteria in the browser against the local API with the seeded users (Docker required)
- [x] 5.2 Run `pnpm format:check`, `pnpm verify` (typecheck, lint, tests, `openspec validate --strict`), `pnpm test:coverage`, `pnpm test:e2e`, and `pnpm build`
- [x] 5.3 Write `docs/changes/f01-login.md` from the change template, record the ADR evaluation, and add it to the index
