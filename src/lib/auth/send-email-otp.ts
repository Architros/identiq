import {
  mapOtpSendError,
  normalizeEmail,
  OTP_SEND_SUCCESS_MESSAGE,
  type OtpPurpose,
} from "@/lib/auth/email-otp";
import { createClient } from "@/lib/supabase/client";

export type SendEmailOtpResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/**
 * Sends a 6-digit email OTP via Supabase (Magic Link template with {{ .Token }}).
 * Runs in the browser so login/forgot-password work without hitting protected API routes.
 */
export async function sendEmailOtp(
  email: string,
  purpose: OtpPurpose,
): Promise<SendEmailOtpResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizeEmail(email),
    options: {
      shouldCreateUser: purpose === "signup",
    },
  });

  if (error) {
    const mapped = mapOtpSendError(error.message);
    return { ok: false, error: mapped.error };
  }

  return { ok: true, message: OTP_SEND_SUCCESS_MESSAGE };
}
