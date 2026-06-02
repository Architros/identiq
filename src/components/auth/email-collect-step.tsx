"use client";

import { useState } from "react";
import type { OtpPurpose } from "@/lib/auth/email-otp";
import { normalizeEmail } from "@/lib/auth/email-otp";
import { sendEmailOtp } from "@/lib/auth/send-email-otp";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import { TextureButton } from "@/components/ui/texture-button";

const inputClass =
  "w-full rounded-lg border-0 bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:cursor-not-allowed disabled:opacity-60";

type EmailCollectStepProps = {
  purpose: OtpPurpose;
  description: string;
  submitLabel: string;
  onBack: () => void;
  onSent: (email: string) => void;
  onError: (message: string | null) => void;
  disabled?: boolean;
};

export function EmailCollectStep({
  purpose,
  description,
  submitLabel,
  onBack,
  onSent,
  onError,
  disabled = false,
}: EmailCollectStepProps) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      onError("Enter a valid email address.");
      return;
    }

    setSending(true);
    onError(null);

    try {
      const result = await sendEmailOtp(trimmed, purpose);
      if (!result.ok) {
        onError(result.error);
        return;
      }

      onSent(normalizeEmail(trimmed));
    } catch (e) {
      onError(
        e instanceof Error ? e.message : "Could not send a verification code.",
      );
    } finally {
      setSending(false);
    }
  };

  const busy = disabled || sending;

  return (
    <div className="w-full space-y-5">
      <p className="text-center text-sm text-muted">{description}</p>

      <input
        type="email"
        autoComplete="email"
        placeholder="Email address"
        value={email}
        disabled={busy}
        onChange={(e) => {
          setEmail(e.target.value);
          onError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !busy) void handleSubmit();
        }}
        className={inputClass}
      />

      <TextureButton
        type="button"
        variant="accent"
        shape="lg"
        fullWidth
        disabled={busy}
        onClick={() => void handleSubmit()}
        innerClassName="w-full gap-2 px-4 py-3 font-medium disabled:opacity-60"
      >
        {sending ? (
          <>
            <ButtonSpinner />
            <span>Sending…</span>
          </>
        ) : (
          submitLabel
        )}
      </TextureButton>

      <button
        type="button"
        disabled={busy}
        onClick={onBack}
        className="mx-auto block text-sm text-muted underline-offset-2 hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        Back to sign in
      </button>
    </div>
  );
}
