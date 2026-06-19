import {
  mapOtpSendError,
  normalizeEmail,
  OTP_SEND_SUCCESS_MESSAGE,
  type OtpPurpose,
} from "@/lib/auth/email-otp";

export type SendEmailOtpResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/**
 * Requests a 6-digit email OTP via `POST /api/auth/otp/send`.
 * Server uses Supabase without `emailRedirectTo` so templates can send codes only.
 */
export async function sendEmailOtp(
  email: string,
  purpose: OtpPurpose,
): Promise<SendEmailOtpResult> {
  const normalized = normalizeEmail(email);

  let response: Response;
  try {
    response = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalized, purpose }),
    });
  } catch {
    return {
      ok: false,
      error: "Could not send a verification code. Check your connection and try again.",
    };
  }

  let body: { error?: string } = {};
  try {
    body = (await response.json()) as { error?: string };
  } catch {
    // ignore parse errors
  }

  if (!response.ok) {
    const mapped = mapOtpSendError(body.error ?? "Request failed", purpose);
    return { ok: false, error: mapped.error };
  }

  return { ok: true, message: OTP_SEND_SUCCESS_MESSAGE };
}
