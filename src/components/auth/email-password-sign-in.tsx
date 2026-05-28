"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/auth/password-field";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import { TextureButton } from "@/components/ui/texture-button";
import { dispatchAuthSignedIn } from "@/lib/auth/client-storage";
import { mapPasswordSignInError, normalizeEmail } from "@/lib/auth/email-otp";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded-lg border-0 bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:cursor-not-allowed disabled:opacity-60";

type EmailPasswordSignInProps = {
  next: string;
  onError: (message: string | null) => void;
  onForgotPassword: () => void;
  onCreateAccount: () => void;
  disabled?: boolean;
};

export function EmailPasswordSignIn({
  next,
  onError,
  onForgotPassword,
  onCreateAccount,
  disabled = false,
}: EmailPasswordSignInProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      onError("Enter a valid email address.");
      return;
    }
    if (!password) {
      onError("Enter your password.");
      return;
    }

    setSubmitting(true);
    onError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(trimmed),
        password,
      });

      if (error) {
        onError(mapPasswordSignInError(error.message));
        return;
      }

      dispatchAuthSignedIn();

      const completeRes = await fetch("/api/auth/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ next, intent: "signin" }),
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
      onError(e instanceof Error ? e.message : "Could not sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  const busy = disabled || submitting;

  return (
    <div className="w-full space-y-4">
      <div className="space-y-3">
        <label htmlFor="sign-in-email" className="sr-only">
          Email
        </label>
        <input
          id="sign-in-email"
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
        <PasswordField
          id="sign-in-password"
          label="Password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          disabled={busy}
          onChange={(value) => {
            setPassword(value);
            onError(null);
          }}
          onEnter={() => {
            if (!busy) void handleSubmit();
          }}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={onForgotPassword}
          className="cursor-pointer text-sm text-muted underline-offset-2 hover:text-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          Forgot password?
        </button>
      </div>

      <TextureButton
        type="button"
        variant="accent"
        shape="lg"
        fullWidth
        disabled={busy}
        onClick={() => void handleSubmit()}
        innerClassName="w-full gap-2 px-4 py-3 font-medium disabled:opacity-60"
      >
        {submitting ? (
          <>
            <ButtonSpinner />
            <span>Signing in…</span>
          </>
        ) : (
          "Sign in"
        )}
      </TextureButton>

      <p className="text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          disabled={busy}
          onClick={onCreateAccount}
          className="cursor-pointer font-medium text-foreground underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          Create account
        </button>
      </p>
    </div>
  );
}
