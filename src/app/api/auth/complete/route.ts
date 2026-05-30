import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureProfileForUser } from "@/lib/auth/ensure-profile";
import { resolvePostAuthPath } from "@/lib/auth/post-auth-redirect";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler";

const bodySchema = z.object({
  next: z.string().optional(),
  intent: z.enum(["signin", "signup", "recovery"]).optional(),
  access_token: z.string().optional(),
  refresh_token: z.string().optional(),
});

function isLikelyExistingAccount(createdAtRaw: string | null | undefined): boolean {
  if (!createdAtRaw) return false;
  const createdAtMs = Date.parse(createdAtRaw);
  if (!Number.isFinite(createdAtMs)) return false;
  // If account creation is older than this window, treat as existing.
  return Date.now() - createdAtMs > 15 * 60 * 1000;
}

async function resolveAuthenticatedUser(
  request: Request,
  supabase: ReturnType<typeof createRouteHandlerSupabase>["supabase"],
  tokens?: { access_token?: string; refresh_token?: string },
) {
  const {
    data: { user: cookieUser },
    error: cookieError,
  } = await supabase.auth.getUser();

  if (!cookieError && cookieUser) {
    return cookieUser;
  }

  if (tokens?.access_token && tokens.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });
    if (!error && data.user) {
      return data.user;
    }
  }

  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!bearer) return null;

  const {
    data: { user: bearerUser },
    error: bearerError,
  } = await supabase.auth.getUser(bearer);

  if (bearerError || !bearerUser) return null;
  return bearerUser;
}

export async function POST(request: Request) {
  const { supabase, withCookies } = createRouteHandlerSupabase(request);

  let next: string | undefined;
  let intent: "signin" | "signup" | "recovery" | undefined;
  let access_token: string | undefined;
  let refresh_token: string | undefined;
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    next = parsed.success ? parsed.data.next : undefined;
    intent = parsed.success ? parsed.data.intent : undefined;
    access_token = parsed.success ? parsed.data.access_token : undefined;
    refresh_token = parsed.success ? parsed.data.refresh_token : undefined;
  } catch {
    next = undefined;
    intent = undefined;
    access_token = undefined;
    refresh_token = undefined;
  }

  const user = await resolveAuthenticatedUser(request, supabase, {
    access_token,
    refresh_token,
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureProfileForUser(user);
  const nextPath =
    intent === "signup" &&
    next === "/new-brand" &&
    isLikelyExistingAccount(user.created_at)
      ? "/"
      : next;
  const redirectTo = await resolvePostAuthPath(user.id, nextPath);

  return withCookies(NextResponse.json({ redirectTo }));
}
