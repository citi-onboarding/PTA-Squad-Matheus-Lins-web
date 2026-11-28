## Purpose

Lets portal users sign in and out through the web, keeps their session while they work, protects internal pages, sends each role to its home page, and denies pages a role cannot open (F01, US-001, RN-08, RN-14).

## ADDED Requirements

### Requirement: Valid sign-in leads to the role's home page

The portal SHALL offer a sign-in page at `/entrar` with labelled email and password fields and an "Entrar" button. On valid credentials it MUST open the home page of the user's role: seller → `/clientes`, manager → `/painel`, finance → `/painel`, admin → `/admin`.

#### Scenario: Seller signs in

- **WHEN** a seller submits the correct email and password on `/entrar`
- **THEN** the portal shows `/clientes`

#### Scenario: Manager signs in

- **WHEN** a manager submits the correct email and password on `/entrar`
- **THEN** the portal shows `/painel`

#### Scenario: Finance signs in

- **WHEN** a finance user submits the correct email and password on `/entrar`
- **THEN** the portal shows `/painel`

#### Scenario: Admin signs in

- **WHEN** an admin submits the correct email and password on `/entrar`
- **THEN** the portal shows `/admin`

### Requirement: Failed sign-in shows an announced message and keeps the email

On a rejected sign-in the portal MUST show `"E-mail ou senha incorretos"` in an alert that assistive technology announces, without indicating which field is wrong, and MUST keep the typed email.

#### Scenario: Wrong credentials

- **WHEN** the API rejects the submitted credentials with 401
- **THEN** an alert shows `"E-mail ou senha incorretos"`
- **AND** the email field still holds the typed email

#### Scenario: API unavailable during sign-in

- **WHEN** the sign-in request fails for any reason other than a 401, such as a server error or no connection
- **THEN** an alert shows `"Não foi possível entrar agora. Tente novamente."` instead of the credentials message
- **AND** the email field still holds the typed email

### Requirement: Sign-in is sent only once at a time

The portal MUST disable the "Entrar" button while a sign-in request is in flight.

#### Scenario: Button disabled while sending

- **WHEN** the user submits the sign-in form and the API has not answered yet
- **THEN** the "Entrar" button is disabled

### Requirement: Internal pages require a session

The portal MUST send a visitor without a session who opens any internal page to `/entrar`, and after a valid sign-in MUST return them to the page they tried to open. Opening `/` with a session MUST lead to the role's home page.

#### Scenario: Visitor opens an internal page

- **WHEN** a visitor without a session opens `/painel`
- **THEN** the portal shows `/entrar`

#### Scenario: Return to the requested page after sign-in

- **WHEN** a visitor without a session opens `/contratos`, is sent to `/entrar`, and signs in as a manager
- **THEN** the portal shows `/contratos`

#### Scenario: Root with a session

- **WHEN** a signed-in seller opens `/`
- **THEN** the portal shows `/clientes`

### Requirement: Pages a role cannot open are denied

The portal SHALL allow `/clientes` to seller, manager, and finance; `/painel` to manager and finance; `/contratos` to manager; and `/admin` to admin (PRD 4.2). Any other signed-in role MUST see `"Você não tem acesso a esta página"` instead of the page.

#### Scenario: Seller opens the dashboard

- **WHEN** a signed-in seller opens `/painel`
- **THEN** the portal shows `"Você não tem acesso a esta página"`

#### Scenario: Seller opens the contracts

- **WHEN** a signed-in seller opens `/contratos`
- **THEN** the portal shows `"Você não tem acesso a esta página"`

#### Scenario: Manager opens the contracts

- **WHEN** a signed-in manager opens `/contratos`
- **THEN** the portal shows the contracts page

### Requirement: Any unauthorized API answer ends the session

When any API call answers 401, the portal MUST discard the session and show `/entrar`.

#### Scenario: Expired session on page load

- **WHEN** a signed-in user opens an internal page and the API answers 401 to the session check
- **THEN** the portal shows `/entrar`
- **AND** the stored token is discarded

#### Scenario: Session check fails without a 401

- **WHEN** a signed-in user opens an internal page and the session check fails with a server error
- **THEN** the portal shows an alert `"Não foi possível carregar sua sessão. Recarregue a página."`
- **AND** the stored token is kept

### Requirement: Users can sign out

The portal SHALL offer a "Sair" button on internal pages. Activating it MUST call the API sign-out, discard the token, and show `/entrar`. Going back in the browser afterwards MUST NOT show an internal page.

#### Scenario: Sign out

- **WHEN** a signed-in user activates "Sair"
- **THEN** the API sign-out is called with the session token
- **AND** the stored token is discarded
- **AND** the portal shows `/entrar`

#### Scenario: Back after sign-out

- **WHEN** a user signs out and then goes back in the browser
- **THEN** the portal shows `/entrar` instead of the internal page

### Requirement: The session token is kept only where the backend ADR allows

The portal MUST keep the session token only in memory and in `sessionStorage`, MUST NOT write it to `localStorage`, and MUST send it as `Authorization: Bearer <token>` on every API call. A page reload in the same tab MUST keep the session.

#### Scenario: Token sent and never in localStorage

- **WHEN** a user signs in and an internal page loads
- **THEN** the session check is sent with `Authorization: Bearer <token>`
- **AND** `localStorage` does not contain the token

#### Scenario: Reload keeps the session

- **WHEN** a signed-in user reloads an internal page in the same tab
- **THEN** the page opens without asking to sign in again

### Requirement: Sign-in and sign-out are accessible

The sign-in and internal pages MUST have labelled fields, work fully with the keyboard, have no automatically detectable WCAG 2.1 AA violations, and show no horizontal scroll at 390 px wide.

#### Scenario: Accessible flow on mobile and desktop

- **WHEN** a user signs in and signs out at 390 px wide and at desktop width using the keyboard
- **THEN** no automatically detectable accessibility violation is found
- **AND** the page has no horizontal scroll at 390 px
