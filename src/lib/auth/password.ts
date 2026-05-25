import { z } from "zod";

/** Match Supabase Auth default minimum (Dashboard → Auth → Providers → Email). */
export const PASSWORD_MIN_LENGTH = 6;

export const passwordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
  )
  .max(72, "Password must be at most 72 characters.");

export const setPasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SetPasswordFormValues = z.infer<typeof setPasswordFormSchema>;

export type PasswordRequirementId = "min_length" | "passwords_match";

export type PasswordRequirement = {
  id: PasswordRequirementId;
  label: string;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "min_length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
  },
  { id: "passwords_match", label: "Passwords match" },
];

export function getPasswordRequirementStatus(
  password: string,
  confirmPassword: string,
): Record<PasswordRequirementId, boolean> {
  return {
    min_length: password.length >= PASSWORD_MIN_LENGTH,
    passwords_match:
      confirmPassword.length > 0 && password === confirmPassword,
  };
}

export function userNeedsPasswordSetup(
  metadata: Record<string, unknown> | undefined,
): boolean {
  return metadata?.password_configured !== true;
}

/** Email OTP users must set a password; OAuth-only users skip this step. */
export function userMustSetPassword(user: {
  user_metadata?: Record<string, unknown>;
  identities?: { provider: string }[] | null;
}): boolean {
  if (!userNeedsPasswordSetup(user.user_metadata)) return false;
  const providers = user.identities?.map((i) => i.provider) ?? [];
  return providers.includes("email");
}

export function mapPasswordUpdateError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("at least") || lower.includes("too short")) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (lower.includes("weak") || lower.includes("strength")) {
    return "Choose a stronger password (mix letters and numbers).";
  }
  if (lower.includes("same") && lower.includes("password")) {
    return "New password must be different from your current password.";
  }
  return "Could not save your password. Try again.";
}
