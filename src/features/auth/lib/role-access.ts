import type { Role } from "../types/auth";

export type ProtectedPage = "customers" | "dashboard" | "contracts" | "admin";

/** Who may open each page (PRD 4.2). The API enforces the same rules (RN-08). */
const allowedRoles: Record<ProtectedPage, readonly Role[]> = {
  customers: ["SELLER", "MANAGER", "FINANCE"],
  dashboard: ["MANAGER", "FINANCE"],
  contracts: ["MANAGER"],
  admin: ["ADMIN"],
};

const homePaths: Record<Role, string> = {
  SELLER: "/clientes",
  MANAGER: "/painel",
  FINANCE: "/painel",
  ADMIN: "/admin",
};

export function homePathFor(role: Role): string {
  return homePaths[role];
}

export function canAccess(role: Role, page: ProtectedPage): boolean {
  return allowedRoles[page].includes(role);
}
