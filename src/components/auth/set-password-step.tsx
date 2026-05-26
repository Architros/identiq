"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordRequirementsList } from "@/components/auth/password-requirements-list";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import { TextureButton } from "@/components/ui/texture-button";
import { dispatchAuthSignedIn } from "@/lib/auth/client-storage";
import {
  getPasswordRequirementStatus,
  mapPasswordUpdateError,
  setPasswordFormSchema,
} from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";

type SetPasswordStepProps = {
  next: string;
  onError: (message: string | null) => void;
};

export function SetPasswordStep({ next, onError }: SetPasswordStepProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const requirementsMet = useMemo(() => {
    const status = getPasswordRequirementStatus(password, confirmPassword);
    return status.min_length && status.passwords_match;
  }, [password, confirmPassword]);

  const finishSignIn = async () => {
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
  };

  const handleSubmit = async () => {
    onError(null);
    setFieldErrors({});

    const parsed = setPasswordFormSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      const nextErrors: { password?: string; confirmPassword?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "password" || key === "confirmPassword") {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      if (!nextErrors.password && !nextErrors.confirmPassword) {
        onError(parsed.error.issues[0]?.message ?? "Invalid password.");
      }
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: parsed.data.password,
        data: { password_configured: true },
      });

      if (error) {
        onError(mapPasswordUpdateError(error.message));
        return;
      }

      dispatchAuthSignedIn();
      await finishSignIn();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not save your password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      <div className="text-center">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Create your password
        </h2>
        <p className="mt-2 text-sm text-muted">
          You&apos;ll use this password to sign in with your email next time.
        </p>
      </div>

      <PasswordRequirementsList
        password={password}
        confirmPassword={confirmPassword}
      />

      <div className="space-y-3">
        <PasswordField
          id="new-password"
          label="Password"
          placeholder="Password"
          value={password}
          disabled={saving}
          error={fieldErrors.password}
          onChange={(value) => {
            setPassword(value);
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
            onError(null);
          }}
          onEnter={() => {
            if (!saving) void handleSubmit();
          }}
        />

        <PasswordField
          id="confirm-password"
          label="Confirm password"
          placeholder="Confirm password"
          value={confirmPassword}
          disabled={saving}
          error={fieldErrors.confirmPassword}
          onChange={(value) => {
            setConfirmPassword(value);
            setFieldErrors((prev) => ({
              ...prev,
              confirmPassword: undefined,
            }));
            onError(null);
          }}
          onEnter={() => {
            if (!saving) void handleSubmit();
          }}
        />
      </div>

      <TextureButton
        type="button"
        variant="accent"
        shape="lg"
        fullWidth
        disabled={saving || !requirementsMet}
        onClick={() => void handleSubmit()}
        innerClassName="w-full gap-2 px-4 py-3 font-medium disabled:opacity-60"
      >
        {saving ? (
          <>
            <ButtonSpinner />
            <span>Saving…</span>
          </>
        ) : (
          "Continue"
        )}
      </TextureButton>
    </div>
  );
}
