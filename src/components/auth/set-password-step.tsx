"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordRequirementsList } from "@/components/auth/password-requirements-list";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import { TextureButton } from "@/components/ui/texture-button";
import { completeSignIn } from "@/lib/auth/complete-sign-in";
import { dispatchAuthSignedIn } from "@/lib/auth/client-storage";
import {
  getPasswordRequirementStatus,
  mapPasswordUpdateError,
  setPasswordFormSchema,
} from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";

export type SetPasswordVariant = "signup" | "recovery";

type SetPasswordStepProps = {
  next: string;
  variant?: SetPasswordVariant;
  onError: (message: string | null) => void;
};

const COPY: Record<
  SetPasswordVariant,
  { description: string; submit: string }
> = {
  signup: {
    description:
      "You'll use this password to sign in with your email next time.",
    submit: "Continue",
  },
  recovery: {
    description: "Choose a new password for your account.",
    submit: "Update password",
  },
};

export function SetPasswordStep({
  next,
  variant = "signup",
  onError,
}: SetPasswordStepProps) {
  const router = useRouter();
  const copy = COPY[variant];
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const requirementsMet = useMemo(() => {
    const status = getPasswordRequirementStatus(password, confirmPassword);
    return status.min_length && status.char_mix && status.passwords_match;
  }, [password, confirmPassword]);

  const finishSignIn = async (supabase: ReturnType<typeof createClient>) => {
    const result = await completeSignIn(supabase, {
      next,
      intent: variant === "signup" ? "signup" : "recovery",
    });

    if (!result.ok) {
      throw new Error(result.error);
    }

    router.replace(result.redirectTo);
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
      await supabase.auth.refreshSession();
      await finishSignIn(supabase);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not save your password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-5">
      <p className="text-center text-sm text-muted">{copy.description}</p>

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

      <PasswordRequirementsList
        password={password}
        confirmPassword={confirmPassword}
      />

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
          copy.submit
        )}
      </TextureButton>
    </div>
  );
}
