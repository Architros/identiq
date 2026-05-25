import { type NextRequest, NextResponse } from "next/server";
import { resolvePostAuthPath } from "@/lib/auth/post-auth-redirect";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const { supabase, withCookies } = createRouteHandlerSupabase(request);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const path = await resolvePostAuthPath(user.id, next);
        return withCookies(NextResponse.redirect(`${origin}${path}`));
      }
    }
  }

  return withCookies(
    NextResponse.redirect(`${origin}/login?error=auth_callback_failed`),
  );
}
