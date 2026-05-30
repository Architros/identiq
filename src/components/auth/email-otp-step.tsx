"use client";

import { useCallback, useEffect, useState } from "react";
import { OtpInput } from "@/components/auth/otp-input";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import { TextureButton } from "@/components/ui/texture-button";
import {
  mapOtpVerifyError,
  normalizeEmail,
  OTP_LENGTH,
  type OtpPurpose,
} from "@/lib/auth/email-otp";
import { sendEmailOtp } from "@/lib/auth/send-email-otp";
import { createClient } from "@/lib/supabase/client";

const RESEND_COOLDOWN_SEC = 60;

type EmailOtpStepProps = {
  email: string;
  purpose: OtpPurpose;
  onBack: () => void;
  onVerified: () => void;
  onError: (message: string | null) => void;
  disabled?: boolean;
  setDisabled: (value: boolean) => void;
};

export function EmailOtpStep({
  email,
  purpose,
  onBack,
  onVerified,
  onError,
  disabled = false,
  setDisabled,
}: EmailOtpStepProps) {
  const [token, setToken] = useState("");
  const [resendSeconds, setResendSeconds] = useState(RESEND_COOLDOWN_SEC);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const id = window.setInterval(() => {
      setResendSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendSeconds]);

  const sendOtp = useCallback(async () => {
    const result = await sendEmailOtp(email, purpose);
    if (!result.ok) {
      throw new Error(result.error);
    }
  }, [email, purpose]);

  const handleVerify = useCallback(
    async (codeOverride?: string) => {
      const code = (codeOverride ?? token).replace(/\D/g, "");
      if (code.length !== OTP_LENGTH) {
        onError(`Enter the ${OTP_LENGTH}-digit code from your email.`);
        return;
      }

      setVerifying(true);
      setDisabled(true);
      onError(null);

      try {
        const supabase = createClient();
        // Recovery codes are sent via signInWithOtp (Magic Link template), same as signup.
        const { error } = await supabase.auth.verifyOtp({
          email: normalizeEmail(email),
          token: code,
          type: "email",
        });

        if (error) {
          onError(mapOtpVerifyError(error.message));
          return;
        }

        onVerified();
      } catch (e) {
        onError(e instanceof Error ? e.message : "Verification failed.");
      } finally {
        setVerifying(false);
        setDisabled(false);
      }
    },
    [email, onError, onVerified, purpose, setDisabled, token],
  );

  const handleResend = async () => {
    if (resendSeconds > 0 || resending) return;
    setResending(true);
    onError(null);
    try {
      await sendOtp();
      setResendSeconds(RESEND_COOLDOWN_SEC);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not resend code.");
    } finally {
      setResending(false);
    }
  };

  const busy = disabled || verifying || resending;

  return (
    <div className="w-full space-y-5">
      <p className="text-center text-sm text-muted">
        We sent a code to{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>

      <OtpInput
        value={token}
        disabled={busy}
        onChange={(digits) => {
          setToken(digits);
          onError(null);
        }}
        onComplete={(code) => {
          if (!busy) void handleVerify(code);
        }}
      />

      <TextureButton
        type="button"
        variant="accent"
        shape="lg"
        fullWidth
        disabled={busy}
        onClick={() => void handleVerify()}
        innerClassName="w-full gap-2 px-4 py-3 font-medium disabled:opacity-60"
      >
        {verifying ? (
          <>
            <ButtonSpinner />
            <span>Verifying…</span>
          </>
        ) : (
          "Verify"
        )}
      </TextureButton>

      <div className="flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          disabled={busy || resendSeconds > 0}
          onClick={() => void handleResend()}
          className="cursor-pointer text-foreground underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          {resendSeconds > 0 ? (
            `Resend code in ${resendSeconds}s`
          ) : resending ? (
            <span className="inline-flex items-center gap-2">
              <ButtonSpinner className="h-3.5 w-3.5" />
              Sending…
            </span>
          ) : (
            "Resend code"
          )}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onBack}
          className="cursor-pointer text-muted underline-offset-2 hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          Use a different email
        </button>
      </div>
    </div>
  );
}
