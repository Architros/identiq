"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OtpInput } from "@/components/auth/otp-input";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import { TextureButton } from "@/components/ui/texture-button";
import {
  mapOtpVerifyError,
  normalizeEmail,
  OTP_LENGTH,
} from "@/lib/auth/email-otp";
import { userMustSetPassword } from "@/lib/auth/password";
import { dispatchAuthSignedIn } from "@/lib/auth/client-storage";
import { createClient } from "@/lib/supabase/client";

const RESEND_COOLDOWN_SEC = 60;

type EmailOtpStepProps = {
  email: string;
  next: string;
  onBack: () => void;
  onNeedsPassword: () => void;
  onError: (message: string | null) => void;
  disabled?: boolean;
  setDisabled: (value: boolean) => void;
};

export function EmailOtpStep({
  email,
  next,
  onBack,
  onNeedsPassword,
  onError,
  disabled = false,
  setDisabled,
}: EmailOtpStepProps) {
  const router = useRouter();
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
    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizeEmail(email) }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Could not send a verification code.");
    }
  }, [email]);

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
        const { error } = await supabase.auth.verifyOtp({
          email: normalizeEmail(email),
          token: code,
          type: "email",
        });

        if (error) {
          onError(mapOtpVerifyError(error.message));
          return;
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("Could not load your account. Try again.");
        }

        if (userMustSetPassword(user)) {
          dispatchAuthSignedIn();
          onNeedsPassword();
          return;
        }

        dispatchAuthSignedIn();

        const completeRes = await fetch("/api/auth/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ next }),
        });

        if (!completeRes.ok) {
          const data = (await completeRes.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(data.error ?? "Could not finish sign in.");
        }

        const { redirectTo } = (await completeRes.json()) as {
          redirectTo: string;
        };

        router.replace(redirectTo);
        router.refresh();
      } catch (e) {
        onError(e instanceof Error ? e.message : "Verification failed.");
      } finally {
        setVerifying(false);
        setDisabled(false);
      }
    },
    [email, next, onError, onNeedsPassword, router, setDisabled, token],
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
          className="text-foreground underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
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
          className="text-muted underline-offset-2 hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          Use a different email
        </button>
      </div>
    </div>
  );
}
