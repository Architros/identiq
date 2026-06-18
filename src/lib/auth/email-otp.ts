import { z } from "zod";

export const OTP_LENGTH = 6;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(320);

export const otpTokenSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, `Enter the ${OTP_LENGTH}-digit code from your email.`);

export const otpPurposeSchema = z.enum(["signup", "recovery"]);

export type OtpPurpose = z.infer<typeof otpPurposeSchema>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Generic copy — do not reveal whether the account exists. */
export const OTP_SEND_SUCCESS_MESSAGE =
  "If that email can receive mail, we sent a verification code.";

export function mapOtpSendError(
  message: string,
  purpose?: OtpPurpose,
): {
  status: number;
  error: string;
} {
  const lower = message.toLowerCase();
  if (lower.includes("email logins are disabled")) {
    return {
      status: 400,
      error:
        "Email sign-in is disabled in Supabase. Enable the Email provider under Authentication → Providers.",
    };
  }
  if (
    lower.includes("weak_password") ||
    (lower.includes("password") && lower.includes("at least"))
  ) {
    return {
      status: 422,
      error:
        "Password policy in Supabase is blocking OTP emails. Lower Authentication → Password minimum length, or contact support.",
    };
  }
  if (
    lower.includes("signups not allowed") ||
    lower.includes("user not found") ||
    lower.includes("no user")
  ) {
    return {
      status: 422,
      error:
        purpose === "recovery"
          ? "If that email is registered with a password, we sent a code. Check your inbox and spam folder."
          : "Could not send a verification code. Try again shortly.",
    };
  }
  if (
    lower.includes("rate") ||
    lower.includes("too many") ||
    lower.includes("429")
  ) {
    return {
      status: 429,
      error: "Too many attempts. Wait a few minutes and try again.",
    };
  }
  if (lower.includes("invalid") && lower.includes("email")) {
    return { status: 400, error: "Enter a valid email address." };
  }
  if (lower.includes("redirect") || lower.includes("redirect_to")) {
    return {
      status: 400,
      error:
        "Password reset is misconfigured. Add your site URL to Supabase Authentication → URL configuration → Redirect URLs.",
    };
  }
  return {
    status: 400,
    error: "Could not send a verification code. Try again shortly.",
  };
}

export function mapPasswordSignInError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Incorrect email or password.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email first, or use Forgot password.";
  }
  if (lower.includes("email logins are disabled")) {
    return "Email sign-in is disabled. Enable the Email provider in Supabase.";
  }
  return "Could not sign in. Try again.";
}

export function mapOtpVerifyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("expired")) {
    return "That code has expired. Request a new one.";
  }
  if (lower.includes("invalid") || lower.includes("token")) {
    return "That code is incorrect. Check your email and try again.";
  }
  return "Verification failed. Try again.";
}
