"use client";

import Image from "next/image";
import { Suspense, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const HERO_IMAGE = "/Hiker in Misty Mountains.png";

const GITHUB_ICON_SRC = "/icons/github.png";

const oauthButtonClass =
  "flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border-0 bg-[#ececef] px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-[#e2e2e6] disabled:cursor-not-allowed disabled:opacity-60";

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

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/billing";
  const authError = searchParams.get("error");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    authError === "auth_callback_failed"
      ? "Sign in could not be completed. Please try again."
      : null,
  );

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
        <p className="mb-4 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="w-full space-y-3">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => signIn("google")}
          className={oauthButtonClass}
        >
          <ProviderIcon>
            <GoogleIcon className="h-5 w-5" />
          </ProviderIcon>
          {loading === "google" ? "Redirecting…" : "Continue with Google"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => signIn("github")}
          className={oauthButtonClass}
        >
          <ProviderIcon>
            <GitHubIcon />
          </ProviderIcon>
          {loading === "github" ? "Redirecting…" : "Continue with GitHub"}
        </button>
      </div>

      <p className="mt-10 max-w-[320px] text-center text-xs leading-relaxed text-muted">
        By continuing, you agree to Identiq&apos;s Terms of Service and Privacy
        Policy.
      </p>
    </div>
  );
}

export function LoginScreen() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f3f4f6] lg:flex-row">
      {/* Hero — left on desktop, top on mobile */}
      <div className="relative h-[38vh] min-h-[220px] shrink-0 p-3 pb-0 lg:h-auto lg:min-h-screen lg:w-1/2 lg:p-4 lg:pr-2">
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

      {/* Form — right on desktop */}
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
  );
}
