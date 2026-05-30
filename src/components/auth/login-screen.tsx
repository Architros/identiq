"use client";

import Image from "next/image";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { AuthBrandHeader } from "@/components/auth/auth-brand-header";
import { EmailCollectStep } from "@/components/auth/email-collect-step";
import { EmailOtpStep } from "@/components/auth/email-otp-step";
import { EmailPasswordSignIn } from "@/components/auth/email-password-sign-in";
import { SetPasswordStep } from "@/components/auth/set-password-step";
import { userMustSetPassword } from "@/lib/auth/password";
import { getBrowserAuthOrigin } from "@/lib/auth/site-url";
import type { OtpPurpose } from "@/lib/auth/email-otp";
import { SiteFooter } from "@/components/layout/site-footer";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import { createClient } from "@/lib/supabase/client";

const HERO_IMAGE = "/Hiker in Misty Mountains.png";

const GITHUB_ICON_SRC = "/icons/github.png";

const oauthButtonClass =
  "flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border-0 bg-input px-4 py-3 text-sm font-medium text-foreground transition-all duration-200 hover:-translate-y-px hover:bg-input-hover hover:shadow-sm active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60";

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

type LoginMode =
  | "sign-in"
  | "sign-up-email"
  | "sign-up-otp"
  | "sign-up-password"
  | "forgot-email"
  | "forgot-otp"
  | "forgot-password"
  | "legacy-password";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const authError = searchParams.get("error");
  const [mode, setMode] = useState<LoginMode>("sign-in");
  const [otpEmail, setOtpEmail] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [flowBusy, setFlowBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    authError === "auth_callback_failed"
      ? "Sign in could not be completed. Please try again."
      : null,
  );

  const busy = loading !== null || flowBusy;

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user || !userMustSetPassword(user)) return;
      setMode("legacy-password");
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
      const origin = getBrowserAuthOrigin();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (oauthError) setError(oauthError.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(null);
    }
  };

  const goSignIn = () => {
    setMode("sign-in");
    setOtpEmail("");
    setError(null);
  };

  const goForgotPassword = () => {
    setMode("forgot-email");
    setOtpEmail("");
    setError(null);
  };

  const goSignUp = () => {
    setMode("sign-up-email");
    setOtpEmail("");
    setError(null);
  };

  const otpPurpose: OtpPurpose | null =
    mode === "sign-up-otp"
      ? "signup"
      : mode === "forgot-otp"
        ? "recovery"
        : null;

  const passwordVariant =
    mode === "forgot-password"
      ? "recovery"
      : mode === "sign-up-password" || mode === "legacy-password"
        ? "signup"
        : "signup";

  const showOAuth = mode === "sign-in" || mode === "sign-up-email";

  return (
    <div className="flex w-full max-w-[400px] flex-col items-center">
      <AuthBrandHeader />
      <h1 className="mb-8 font-display text-[1.75rem] font-semibold tracking-tight text-foreground">
        {mode === "sign-in"
          ? "Sign in to Identiq"
          : mode.startsWith("sign-up")
            ? "Create your account"
            : mode.startsWith("forgot")
              ? "Reset your password"
              : "Create your password"}
      </h1>

      {error ? (
        <p className="mb-4 w-full rounded-lg border border-destructive-border bg-destructive-muted px-4 py-3 text-sm text-destructive-text">
          {error}
        </p>
      ) : null}

      {mode === "legacy-password" ||
      mode === "sign-up-password" ||
      mode === "forgot-password" ? (
        <SetPasswordStep
          next={next}
          variant={passwordVariant}
          onError={setError}
        />
      ) : mode === "sign-up-otp" || mode === "forgot-otp" ? (
        <EmailOtpStep
          email={otpEmail}
          purpose={otpPurpose!}
          onBack={() =>
            setMode(mode === "sign-up-otp" ? "sign-up-email" : "forgot-email")
          }
          onVerified={() =>
            setMode(
              mode === "sign-up-otp" ? "sign-up-password" : "forgot-password",
            )
          }
          onError={setError}
          disabled={busy}
          setDisabled={setFlowBusy}
        />
      ) : mode === "sign-up-email" ? (
        <>
          {showOAuth ? (
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
                    "Sign up with Google"
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
                    "Sign up with GitHub"
                  )}
                </button>
              </div>
              <OrDivider />
            </>
          ) : null}
          <EmailCollectStep
            purpose="signup"
            title="Verify your email"
            description="We'll send a 6-digit code to create your account."
            submitLabel="Send verification code"
            onBack={goSignIn}
            onSent={(email) => {
              setOtpEmail(email);
              setMode("sign-up-otp");
            }}
            onError={setError}
            disabled={busy}
          />
        </>
      ) : mode === "forgot-email" ? (
        <EmailCollectStep
          purpose="recovery"
          title="Forgot password?"
          description="We'll send a 6-digit code to reset your password."
          submitLabel="Send reset code"
          onBack={goSignIn}
          onSent={(email) => {
            setOtpEmail(email);
            setMode("forgot-otp");
          }}
          onError={setError}
          disabled={busy}
        />
      ) : (
        <>
          {showOAuth ? (
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
            </>
          ) : null}

          <EmailPasswordSignIn
            next={next}
            onError={setError}
            onForgotPassword={goForgotPassword}
            onCreateAccount={goSignUp}
            disabled={busy}
          />
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
