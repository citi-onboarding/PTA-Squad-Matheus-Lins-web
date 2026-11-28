import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearSessionToken,
  getSessionToken,
  SESSION_TOKEN_STORAGE_KEY,
  setSessionToken,
  subscribeSessionToken,
} from "./session-token";

afterEach(() => {
  clearSessionToken();
  sessionStorage.clear();
  localStorage.clear();
});

describe("F01 / US-001 session token store", () => {
  it("keeps the token in memory and mirrors it to sessionStorage only", () => {
    setSessionToken("token-123");

    expect(getSessionToken()).toBe("token-123");
    expect(sessionStorage.getItem(SESSION_TOKEN_STORAGE_KEY)).toBe("token-123");
    expect(JSON.stringify({ ...localStorage })).not.toContain("token-123");
  });

  it("restores the token from sessionStorage after a reload", () => {
    sessionStorage.setItem(SESSION_TOKEN_STORAGE_KEY, "token-after-reload");

    expect(getSessionToken()).toBe("token-after-reload");
  });

  it("discards the token from memory and sessionStorage", () => {
    setSessionToken("token-123");

    clearSessionToken();

    expect(getSessionToken()).toBeNull();
    expect(sessionStorage.getItem(SESSION_TOKEN_STORAGE_KEY)).toBeNull();
  });

  it("notifies subscribers on every change until they unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSessionToken(listener);

    setSessionToken("token-123");
    clearSessionToken();
    unsubscribe();
    setSessionToken("token-456");

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("keeps working in memory when sessionStorage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    setSessionToken("token-123");

    expect(getSessionToken()).toBe("token-123");
  });
});
