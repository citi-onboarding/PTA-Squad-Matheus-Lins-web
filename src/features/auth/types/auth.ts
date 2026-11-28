import { z } from "zod";

// Matches the backend `f01-auth-api` contract.
export const roleSchema = z.enum(["SELLER", "MANAGER", "FINANCE", "ADMIN"]);

export const authUserSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
});

export const loginResponseSchema = z.object({
  token: z.string().min(1),
  user: authUserSchema,
});

export type Role = z.infer<typeof roleSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export type Credentials = {
  email: string;
  password: string;
};
