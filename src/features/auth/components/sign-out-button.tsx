import { useNavigate } from "react-router-dom";

import { useSignOut } from "../hooks/use-sign-out";

/** Ends the session and returns to the sign-in page, even if the API fails. */
export function SignOutButton() {
  const navigate = useNavigate();
  const signOut = useSignOut();

  return (
    <button
      type="button"
      disabled={signOut.isPending}
      onClick={() =>
        signOut.mutate(undefined, {
          onSettled: () => void navigate("/entrar", { replace: true }),
        })
      }
      className="rounded-md border border-zinc-400 px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100 focus:ring-2 focus:ring-blue-700 focus:outline-none"
    >
      Sair
    </button>
  );
}
