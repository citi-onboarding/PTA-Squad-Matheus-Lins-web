import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { useSession } from "../hooks/use-session";
import { canAccess, homePathFor } from "../lib/role-access";
import type { ProtectedPage } from "../lib/role-access";

type RequireRoleProps = {
  page: ProtectedPage;
  children: ReactNode;
};

/**
 * Shows the page only to roles allowed on it (PRD 4.2). Used inside
 * ProtectedLayout, so the session is already loaded. The API enforces the same
 * rule (RN-08); this only reflects it.
 */
export function RequireRole({ page, children }: RequireRoleProps) {
  const { data: user } = useSession();
  if (!user) return null;

  if (!canAccess(user.role, page))
    return (
      <section className="mx-auto max-w-xl">
        <h1 className="text-xl font-semibold text-zinc-900">
          Você não tem acesso a esta página
        </h1>
        <Link
          to={homePathFor(user.role)}
          className="mt-4 inline-block text-blue-800 underline"
        >
          Ir para a página inicial
        </Link>
      </section>
    );

  return children;
}
