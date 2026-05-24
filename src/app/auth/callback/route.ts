import { NextResponse } from "next/server";
import { resolvePostAuthPath } from "@/lib/auth/post-auth-redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const path = await resolvePostAuthPath(user.id, next);
        return NextResponse.redirect(`${origin}${path}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
