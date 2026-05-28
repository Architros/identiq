"use client";

import { useState } from "react";
import type { OtpPurpose } from "@/lib/auth/email-otp";
import { normalizeEmail } from "@/lib/auth/email-otp";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import { TextureButton } from "@/components/ui/texture-button";

const inputClass =
  "w-full rounded-lg border-0 bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:cursor-not-allowed disabled:opacity-60";

type EmailCollectStepProps = {
  purpose: OtpPurpose;
  title: string;
  description: string;
  submitLabel: string;
  onBack: () => void;
  onSent: (email: string) => void;
  onError: (message: string | null) => void;
  disabled?: boolean;
};

export function EmailCollectStep({
  purpose,
  title,
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
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizeEmail(trimmed),
          purpose,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        onError(data.error ?? "Could not send a verification code.");
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
      <div className="text-center">
        <h2 className="font-display text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted">{description}</p>
      </div>

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
