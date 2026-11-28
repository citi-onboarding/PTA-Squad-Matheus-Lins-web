import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSession } from "../hooks/use-session";
import { SignOutButton } from "./sign-out-button";

/**
 * Wraps every internal page: without a session it sends the visitor to
 * `/entrar`, remembering the page; with one it shows the header and the page.
 */
export function ProtectedLayout() {
  const location = useLocation();
  const session = useSession();

  if (!session.token)
    return (
      <Navigate
        to="/entrar"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );

  if (session.isPending)
    return (
      <p role="status" className="p-6 text-zinc-700">
        Carregando…
      </p>
    );

  // A 401 has already cleared the token, which redirects above; this is any
  // other failure, so the token is kept.
  if (session.isError)
    return (
      <p role="alert" className="p-6 text-red-800">
        Não foi possível carregar sua sessão. Recarregue a página.
      </p>
    );

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-white px-4 py-3">
        <span className="font-semibold text-zinc-900">DistriLux</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-700">{session.data.name}</span>
          <SignOutButton />
        </div>
      </header>
      <main className="px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
