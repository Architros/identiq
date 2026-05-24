"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ctaPrimary } from "@/components/ui/cta-styles";
import {
  mapOtpVerifyError,
  normalizeEmail,
  OTP_LENGTH,
} from "@/lib/auth/email-otp";
import { dispatchAuthSignedIn } from "@/lib/auth/client-storage";
import { createClient } from "@/lib/supabase/client";

const RESEND_COOLDOWN_SEC = 60;

type EmailOtpStepProps = {
  email: string;
  next: string;
  onBack: () => void;
  onError: (message: string | null) => void;
  disabled?: boolean;
  setDisabled: (value: boolean) => void;
};

export function EmailOtpStep({
  email,
  next,
  onBack,
  onError,
  disabled = false,
  setDisabled,
}: EmailOtpStepProps) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [resendSeconds, setResendSeconds] = useState(RESEND_COOLDOWN_SEC);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

  const handleVerify = async () => {
    const code = token.replace(/\D/g, "");
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
  };

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

      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        value={token}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH);
          setToken(digits);
          onError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !busy) void handleVerify();
        }}
        disabled={busy}
        placeholder="000000"
        className="w-full rounded-lg border-0 bg-input px-4 py-3 text-center text-lg tracking-[0.35em] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-60"
        aria-label="Verification code"
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => void handleVerify()}
        className={ctaPrimary(
          "flex w-full cursor-pointer items-center justify-center rounded-lg border-0 px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {verifying ? "Verifying…" : "Verify"}
      </button>

      <div className="flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          disabled={busy || resendSeconds > 0}
          onClick={() => void handleResend()}
          className="text-foreground underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          {resendSeconds > 0
            ? `Resend code in ${resendSeconds}s`
            : resending
              ? "Sending…"
              : "Resend code"}
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
