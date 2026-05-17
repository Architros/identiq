export const ROLES = {
  USER: "user",
  ADMIN: "admin",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];
