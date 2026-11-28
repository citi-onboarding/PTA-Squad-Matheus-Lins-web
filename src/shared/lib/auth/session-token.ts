/**
 * Holds the session token in memory, mirrored to `sessionStorage` so a reload
 * in the same tab keeps the session (backend ADR 0005). Never `localStorage`.
 */
export const SESSION_TOKEN_STORAGE_KEY = "distrilux.session-token";

let token: string | null = null;
const listeners = new Set<() => void>();

function readStorage(): string | null {
  try {
    return sessionStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    else sessionStorage.setItem(SESSION_TOKEN_STORAGE_KEY, value);
  } catch {
    // Blocked storage only loses the reload fallback.
  }
}

function notify() {
  for (const listener of listeners) listener();
}

export function getSessionToken(): string | null {
  token ??= readStorage();
  return token;
}

export function setSessionToken(value: string): void {
  token = value;
  writeStorage(value);
  notify();
}

export function clearSessionToken(): void {
  token = null;
  writeStorage(null);
  notify();
}

export function subscribeSessionToken(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
