import type { SupabaseClient } from "@supabase/supabase-js";

type CompleteSignInInput = {
  next?: string;
  intent?: "signin" | "signup" | "recovery";
};

type CompleteSignInResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string; status: number };

/** Finish auth on the server after client-side sign-in, OTP, or password setup. */
export async function completeSignIn(
  supabase: SupabaseClient,
  input: CompleteSignInInput = {},
): Promise<CompleteSignInResult> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) {
    return {
      ok: false,
      status: 401,
      error: "Your session expired. Sign in again and retry.",
    };
  }

  const accessToken = sessionData.session?.access_token;
  const refreshToken = sessionData.session?.refresh_token;
  if (!accessToken || !refreshToken) {
    return {
      ok: false,
      status: 401,
      error: "Your session expired. Sign in again and retry.",
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  const res = await fetch("/api/auth/complete", {
    method: "POST",
    headers,
    credentials: "same-origin",
    body: JSON.stringify({
      next: input.next,
      intent: input.intent,
      access_token: accessToken,
      refresh_token: refreshToken,
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    redirectTo?: string;
  };

  if (!res.ok) {
    const message =
      data.error === "Unauthorized"
        ? "Your session expired. Sign in again and retry."
        : (data.error ?? "Could not finish sign in.");
    return { ok: false, status: res.status, error: message };
  }

  if (!data.redirectTo) {
    return {
      ok: false,
      status: 500,
      error: "Could not finish sign in.",
    };
  }

  return { ok: true, redirectTo: data.redirectTo };
}
