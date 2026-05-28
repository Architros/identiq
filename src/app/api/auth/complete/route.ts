import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureProfileForUser } from "@/lib/auth/ensure-profile";
import { resolvePostAuthPath } from "@/lib/auth/post-auth-redirect";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler";

const bodySchema = z.object({
  next: z.string().optional(),
  intent: z.enum(["signin", "signup", "recovery"]).optional(),
});

function isLikelyExistingAccount(createdAtRaw: string | null | undefined): boolean {
  if (!createdAtRaw) return false;
  const createdAtMs = Date.parse(createdAtRaw);
  if (!Number.isFinite(createdAtMs)) return false;
  // If account creation is older than this window, treat as existing.
  return Date.now() - createdAtMs > 15 * 60 * 1000;
}

export async function POST(request: Request) {
  const { supabase, withCookies } = createRouteHandlerSupabase(request);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let next: string | undefined;
  let intent: "signin" | "signup" | "recovery" | undefined;
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    next = parsed.success ? parsed.data.next : undefined;
    intent = parsed.success ? parsed.data.intent : undefined;
  } catch {
    next = undefined;
    intent = undefined;
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
