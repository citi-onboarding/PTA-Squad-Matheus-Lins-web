import { describe, expect, it } from "vitest";

import { canAccess, homePathFor } from "../lib/role-access";
import type { ProtectedPage } from "../lib/role-access";
import type { Role } from "../types/auth";

describe("F01 / US-001 / RN-08 role access (PRD 4.2)", () => {
  it.each([
    ["SELLER", "/clientes"],
    ["MANAGER", "/painel"],
    ["FINANCE", "/painel"],
    ["ADMIN", "/admin"],
  ] as const)("sends %s to %s", (role, path) => {
    expect(homePathFor(role)).toBe(path);
  });

  const matrix: Record<ProtectedPage, Role[]> = {
    customers: ["SELLER", "MANAGER", "FINANCE"],
    dashboard: ["MANAGER", "FINANCE"],
    contracts: ["MANAGER"],
    admin: ["ADMIN"],
  };
  const roles: Role[] = ["SELLER", "MANAGER", "FINANCE", "ADMIN"];

  it.each(Object.entries(matrix) as [ProtectedPage, Role[]][])(
    "allows only the PRD roles on %s",
    (page, allowed) => {
      for (const role of roles) {
        expect(canAccess(role, page), `${role} on ${page}`).toBe(
          allowed.includes(role),
        );
      }
    },
  );
});
