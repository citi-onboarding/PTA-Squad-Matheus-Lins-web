/** Router state set when a visitor is sent to the sign-in page. */
export type SignInLocationState = { from?: unknown } | null | undefined;

/**
 * The internal page to return to after signing in, or `null`. Only paths on
 * this site are accepted, so the sign-in page cannot become an open redirect.
 */
export function returnPathFrom(state: SignInLocationState): string | null {
  const from = state?.from;
  if (typeof from !== "string") return null;
  if (!from.startsWith("/") || from.startsWith("//")) return null;
  if (from === "/entrar") return null;
  return from;
}
