import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ApiError } from "@/shared/lib/api/errors";

import { useSignIn } from "../hooks/use-sign-in";
import { homePathFor } from "../lib/role-access";
import { returnPathFrom } from "../lib/return-path";
import type { SignInLocationState } from "../lib/return-path";

const inputClass =
  "mt-1 block w-full rounded-md border border-zinc-400 px-3 py-2 text-base text-zinc-900 focus:border-blue-700 focus:ring-2 focus:ring-blue-700 focus:outline-none";

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    signIn.mutate(
      { email, password },
      {
        onSuccess: ({ user }) => {
          const target =
            returnPathFrom(location.state as SignInLocationState) ??
            homePathFor(user.role);
          void navigate(target, { replace: true });
        },
      },
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Entrar no portal
        </h1>
        <p className="mt-1 text-sm text-zinc-700">DistriLux</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="text-sm font-medium text-zinc-900"
              htmlFor="email"
            >
              E-mail
            </label>
            <input
              id="email"
              className={inputClass}
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label
              className="text-sm font-medium text-zinc-900"
              htmlFor="password"
            >
              Senha
            </label>
            <input
              id="password"
              className={inputClass}
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {signIn.isError ? (
            <p
              role="alert"
              className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {signIn.error instanceof ApiError && signIn.error.status === 401
                ? "E-mail ou senha incorretos"
                : "Não foi possível entrar agora. Tente novamente."}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={signIn.isPending}
            className="w-full rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-zinc-500"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
