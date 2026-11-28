import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

// The e2e web server serves only the built portal, so the backend auth routes
// are answered here. The contract matches the backend `f01-auth-api` change.
const manager = {
  id: 1,
  name: "Fernanda Cavalcanti",
  email: "fernanda.cavalcanti@distrilux.test",
  role: "MANAGER",
};
const PASSWORD = "test-password";
const TOKEN = "e2e-session-token";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, content-type, accept",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

async function answer(route: Route, status: number, body?: unknown) {
  await route.fulfill({
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
    body: body === undefined ? "" : JSON.stringify(body),
  });
}

async function simulateAuthApi(page: Page) {
  let signedIn = false;
  await page.route("**/auth/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === "OPTIONS") return answer(route, 204);
    if (path === "/auth/login") {
      const body = request.postDataJSON() as {
        email: string;
        password: string;
      };
      if (body.email !== manager.email || body.password !== PASSWORD)
        return answer(route, 401, {
          status: 401,
          title: "Unauthorized",
          detail: "E-mail ou senha incorretos",
        });
      signedIn = true;
      return answer(route, 200, { token: TOKEN, user: manager });
    }
    const authorized =
      signedIn && request.headers()["authorization"] === `Bearer ${TOKEN}`;
    if (path === "/auth/me")
      return authorized
        ? answer(route, 200, manager)
        : answer(route, 401, { status: 401 });
    if (path === "/auth/logout") {
      signedIn = false;
      return answer(route, 204);
    }
    return answer(route, 404, { status: 404 });
  });
}

async function expectNoAccessibilityViolations(page: Page) {
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
}

for (const viewport of [
  { name: "390 px", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
]) {
  test.describe(`F01 / US-001 sign-in and sign-out at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("signs in and out with the keyboard without accessibility violations", async ({
      page,
    }) => {
      await simulateAuthApi(page);

      await page.goto("/painel");
      await expect(page).toHaveURL(/\/entrar$/);
      await expect(page.getByLabel("E-mail")).toBeVisible();
      await expectNoAccessibilityViolations(page);
      await expectNoHorizontalScroll(page);

      await page.getByLabel("E-mail").focus();
      await page.keyboard.type(manager.email);
      await page.keyboard.press("Tab");
      await page.keyboard.type("wrong-password");
      await page.keyboard.press("Enter");
      await expect(page.getByRole("alert")).toHaveText(
        "E-mail ou senha incorretos",
      );
      await expect(page.getByLabel("E-mail")).toHaveValue(manager.email);
      await expectNoAccessibilityViolations(page);

      await page.getByLabel("Senha").fill("");
      await page.getByLabel("Senha").focus();
      await page.keyboard.type(PASSWORD);
      await page.keyboard.press("Enter");

      await expect(page).toHaveURL(/\/painel$/);
      await expect(
        page.getByRole("heading", { level: 1, name: "Painel" }),
      ).toBeVisible();
      await expectNoAccessibilityViolations(page);
      await expectNoHorizontalScroll(page);

      // A full page load keeps the session (sessionStorage) and leaves
      // /painel behind in the browser history.
      await page.goto("/contratos");
      await expect(
        page.getByRole("heading", { level: 1, name: "Contratos" }),
      ).toBeVisible();

      await page.getByRole("button", { name: "Sair" }).focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/entrar$/);
      await expectNoAccessibilityViolations(page);

      await page.goBack();
      await expect(page).toHaveURL(/\/entrar$/);
      await expect(page.getByRole("heading", { name: "Painel" })).toHaveCount(
        0,
      );
    });
  });
}
