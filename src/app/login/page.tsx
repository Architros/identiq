"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (provider: "google" | "github") => {
    setLoading(provider);
    setError(null);
    try {
      const supabase = createClient();
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (authError) setError(authError.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-normal tracking-tight text-foreground">
          Sign in to Identiq
        </h1>
        <p className="mt-2 text-sm text-muted">
          Continue with Google or GitHub to create and manage your brands.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => signIn("google")}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground transition hover:bg-sidebar-active disabled:opacity-50"
        >
          {loading === "google" ? "Redirecting…" : "Continue with Google"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => signIn("github")}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground transition hover:bg-sidebar-active disabled:opacity-50"
        >
          {loading === "github" ? "Redirecting…" : "Continue with GitHub"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
