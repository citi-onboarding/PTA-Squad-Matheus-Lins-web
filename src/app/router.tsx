import { createBrowserRouter } from "react-router-dom";
import type { RouteObject } from "react-router-dom";

import { ProtectedLayout } from "@/features/auth/components/protected-layout";
import { RequireRole } from "@/features/auth/components/require-role";
import { RoleHomeRedirect } from "@/features/auth/components/role-home-redirect";
import { SignInPage } from "@/features/auth/components/sign-in-page";
import type { ProtectedPage } from "@/features/auth/lib/role-access";

import { NotFoundPage } from "./routes/not-found-page";
import { RouteErrorPage } from "./routes/route-error-page";
import { UnderConstructionPage } from "./routes/under-construction-page";

/** A provisional internal page, shown only to the roles allowed on it. */
function rolePage(
  path: string,
  page: ProtectedPage,
  title: string,
): RouteObject {
  return {
    path,
    element: (
      <RequireRole page={page}>
        <UnderConstructionPage title={title} />
      </RequireRole>
    ),
  };
}

export const routes: RouteObject[] = [
  {
    path: "/entrar",
    element: <SignInPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    // Every internal page requires a session (F01, US-001).
    element: <ProtectedLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <RoleHomeRedirect /> },
      rolePage("clientes", "customers", "Clientes"),
      rolePage("painel", "dashboard", "Painel"),
      rolePage("contratos", "contracts", "Contratos"),
      rolePage("admin", "admin", "Administração"),
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
];

export const router = createBrowserRouter(routes);
