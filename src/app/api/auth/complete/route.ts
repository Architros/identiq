import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureProfileForUser } from "@/lib/auth/ensure-profile";
import { resolvePostAuthPath } from "@/lib/auth/post-auth-redirect";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler";

const bodySchema = z.object({
  next: z.string().optional(),
});

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
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    next = parsed.success ? parsed.data.next : undefined;
  } catch {
    next = undefined;
  }

  await ensureProfileForUser(user);
  const redirectTo = await resolvePostAuthPath(user.id, next);

  return withCookies(NextResponse.json({ redirectTo }));
}
