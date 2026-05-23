import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function clearSupabaseAuthCookies(
  response: NextResponse,
  cookieNames: { name: string }[],
): void {
  for (const { name } of cookieNames) {
    if (name.startsWith("sb-")) {
      response.cookies.set(name, "", {
        maxAge: 0,
        path: "/",
      });
    }
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });

  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl, { status: 302 });
  clearSupabaseAuthCookies(response, cookieStore.getAll());
  return response;
}

export async function GET(request: Request) {
  return POST(request);
}
