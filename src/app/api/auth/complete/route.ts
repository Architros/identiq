import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/with-auth";
import { ensureProfileForUser } from "@/lib/auth/ensure-profile";
import { resolvePostAuthPath } from "@/lib/auth/post-auth-redirect";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  next: z.string().optional(),
});

export async function POST(request: Request) {
  return withAuth(null, async () => {
    const supabase = await createClient();
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

    return NextResponse.json({ redirectTo });
  });
}
