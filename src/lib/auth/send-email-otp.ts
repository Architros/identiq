import {
  mapOtpSendError,
  normalizeEmail,
  OTP_SEND_SUCCESS_MESSAGE,
  type OtpPurpose,
} from "@/lib/auth/email-otp";
import { getBrowserAuthOrigin } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/client";

export type SendEmailOtpResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

function recoveryRedirectTo(): string {
  const origin = getBrowserAuthOrigin();
  return `${origin}/auth/callback?next=${encodeURIComponent("/login")}`;
}

/**
 * Sends a 6-digit email OTP via Supabase.
 * - signup: Magic Link template (`signInWithOtp`, creates user if needed)
 * - recovery: Reset password template (`resetPasswordForEmail` — avoids 422 from
 *   `signInWithOtp` + `shouldCreateUser: false` on existing accounts)
 *
 * Both templates must include `{{ .Token }}` in Supabase Dashboard.
 */
export async function sendEmailOtp(
  email: string,
  purpose: OtpPurpose,
): Promise<SendEmailOtpResult> {
  const supabase = createClient();
  const normalized = normalizeEmail(email);

  const { error } =
    purpose === "recovery"
      ? await supabase.auth.resetPasswordForEmail(normalized, {
          redirectTo: recoveryRedirectTo(),
        })
      : await supabase.auth.signInWithOtp({
          email: normalized,
          options: {
            shouldCreateUser: true,
          },
        });

  if (error) {
    const mapped = mapOtpSendError(error.message, purpose);
    return { ok: false, error: mapped.error };
  }

  return { ok: true, message: OTP_SEND_SUCCESS_MESSAGE };
}
