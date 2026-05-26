"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { EmailOtpStep } from "@/components/auth/email-otp-step";
import { SetPasswordStep } from "@/components/auth/set-password-step";
import { normalizeEmail } from "@/lib/auth/email-otp";
import { userMustSetPassword } from "@/lib/auth/password";
import { SiteFooter } from "@/components/layout/site-footer";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import { TextureButton } from "@/components/ui/texture-button";
import { createClient } from "@/lib/supabase/client";

const HERO_IMAGE = "/Hiker in Misty Mountains.png";

const GITHUB_ICON_SRC = "/icons/github.png";

const oauthButtonClass =
  "flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border-0 bg-input px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-input-hover disabled:cursor-not-allowed disabled:opacity-60";

const emailInputClass =
  "w-full rounded-lg border-0 bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:cursor-not-allowed disabled:opacity-60";

function ProviderIcon({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 flex-none items-center justify-center">
      {children}
    </span>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={GITHUB_ICON_SRC}
      alt=""
      width={20}
      height={20}
      className="h-5 w-5 object-contain"
      decoding="async"
    />
  );
}

function OrDivider() {
  return (
    <div className="flex w-full items-center gap-3 py-1">
      <span className="h-px flex-1 bg-border" aria-hidden />
      <span className="text-xs font-medium uppercase tracking-wider text-muted">
        or
      </span>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}

type LoginStep = "providers" | "otp" | "password";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const authError = searchParams.get("error");
  const [step, setStep] = useState<LoginStep>("providers");
  const [email, setEmail] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    authError === "auth_callback_failed"
      ? "Sign in could not be completed. Please try again."
      : null,
  );

  const busy = loading !== null || emailBusy;

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user || !userMustSetPassword(user)) return;
      setStep("password");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = async (provider: "google" | "github") => {
    setLoading(provider);
    setError(null);
    try {
      const supabase = createClient();
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (oauthError) setError(oauthError.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(null);
    }
  };

  const sendEmailOtp = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setEmailBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizeEmail(trimmed) }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not send a verification code.");
        return;
      }

      setOtpEmail(normalizeEmail(trimmed));
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send a verification code.");
    } finally {
      setEmailBusy(false);
    }
  };

  const backToProviders = () => {
    setStep("providers");
    setError(null);
  };

  return (
    <div className="flex w-full max-w-[400px] flex-col items-center">
      <div className="mb-8 flex flex-col items-center text-center">
        <p className="mb-5 font-display text-2xl tracking-tight text-foreground">
          identiq
        </p>
        <h1 className="font-display text-[1.75rem] font-semibold tracking-tight text-foreground">
          Sign in to Identiq
        </h1>
      </div>

      {error ? (
        <p className="mb-4 w-full rounded-lg border border-destructive-border bg-destructive-muted px-4 py-3 text-sm text-destructive-text">
          {error}
        </p>
      ) : null}

      {step === "password" ? (
        <SetPasswordStep next={next} onError={setError} />
      ) : step === "otp" ? (
        <EmailOtpStep
          email={otpEmail}
          next={next}
          onBack={backToProviders}
          onNeedsPassword={() => setStep("password")}
          onError={setError}
          disabled={busy}
          setDisabled={setEmailBusy}
        />
      ) : (
        <>
          <div className="w-full space-y-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => signIn("google")}
              className={oauthButtonClass}
            >
              <ProviderIcon>
                <GoogleIcon className="h-5 w-5" />
              </ProviderIcon>
              {loading === "google" ? (
                <>
                  <ButtonSpinner />
                  <span>Redirecting…</span>
                </>
              ) : (
                "Continue with Google"
              )}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => signIn("github")}
              className={oauthButtonClass}
            >
              <ProviderIcon>
                <GitHubIcon />
              </ProviderIcon>
              {loading === "github" ? (
                <>
                  <ButtonSpinner />
                  <span>Redirecting…</span>
                </>
              ) : (
                "Continue with GitHub"
              )}
            </button>
          </div>

          <OrDivider />

          <div className="mt-3 w-full space-y-3">
            <input
              type="email"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !busy) void sendEmailOtp();
              }}
              disabled={busy}
              className={emailInputClass}
            />
            <TextureButton
              type="button"
              variant="accent"
              shape="lg"
              fullWidth
              disabled={busy}
              onClick={() => void sendEmailOtp()}
              innerClassName="w-full gap-2 px-4 py-3 font-medium disabled:opacity-60"
            >
              {emailBusy ? (
                <>
                  <ButtonSpinner />
                  <span>Sending…</span>
                </>
              ) : (
                "Continue with email"
              )}
            </TextureButton>
          </div>
        </>
      )}

      <p className="mt-10 max-w-[320px] text-center text-xs leading-relaxed text-muted">
        By continuing, you agree to Identiq&apos;s Terms of Service and Privacy
        Policy.
      </p>
    </div>
  );
}

export function LoginScreen() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col lg:flex-row">
      <div className="relative h-[38vh] min-h-[220px] shrink-0 p-3 pb-0 lg:h-auto lg:min-h-0 lg:w-1/2 lg:p-4 lg:pr-2">
        <div className="relative h-full w-full overflow-hidden rounded-2xl lg:rounded-3xl lg:rounded-r-[1.75rem]">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 lg:w-1/2 lg:py-16">
        <Suspense
          fallback={
            <p className="text-sm text-muted">Loading sign in…</p>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
      </div>
      <SiteFooter />
    </div>
  );
}
