import type { AppRole } from "@/lib/auth/roles";

export type PermissionAction =
  | "auth:login"
  | "brand:create"
  | "brand:generate"
  | "billing:purchase"
  | "admin:users";

const ROLE_PERMISSIONS: Record<AppRole, PermissionAction[]> = {
  user: ["auth:login", "brand:create", "brand:generate", "billing:purchase"],
  admin: [
    "auth:login",
    "brand:create",
    "brand:generate",
    "billing:purchase",
    "admin:users",
  ],
};

export type AuthUser = {
  id: string;
  email?: string | null;
  role: AppRole;
};

export function can(user: AuthUser | null, action: PermissionAction): boolean {
  if (!user) {
    return action === "auth:login";
  }
  return ROLE_PERMISSIONS[user.role].includes(action);
}
