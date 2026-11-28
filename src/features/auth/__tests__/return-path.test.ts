import { describe, expect, it } from "vitest";

import { returnPathFrom } from "../lib/return-path";

describe("F01 / US-001 return path after sign-in", () => {
  it("returns an internal page with its query string", () => {
    expect(returnPathFrom({ from: "/clientes?busca=abc" })).toBe(
      "/clientes?busca=abc",
    );
  });

  it.each([
    ["no state", undefined],
    ["a missing from", {}],
    ["a non-string from", { from: 42 }],
    ["an absolute URL", { from: "https://evil.example/painel" }],
    ["a protocol-relative URL", { from: "//evil.example/painel" }],
    ["the sign-in page itself", { from: "/entrar" }],
  ])(
    "rejects %s, so sign-in cannot become an open redirect",
    (_case, state) => {
      expect(returnPathFrom(state)).toBeNull();
    },
  );
});
