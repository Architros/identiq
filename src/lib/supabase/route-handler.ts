import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookiePayload = {
  name: string;
  value: string;
  options?: CookieOptions;
};

function parseCookieHeader(header: string): { name: string; value: string }[] {
  if (!header.trim()) return [];
  return header.split(";").map((part) => {
    const eq = part.indexOf("=");
    if (eq === -1) return { name: part.trim(), value: "" };
    return {
      name: part.slice(0, eq).trim(),
      value: part.slice(eq + 1).trim(),
    };
  });
}

/**
 * Supabase client for Route Handlers that redirect.
 * Session refresh cookies are applied via `withCookies(response)`, not `cookies()` from RSC.
 */
export function createRouteHandlerSupabase(request: NextRequest | Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured");
  }

  const pending: CookiePayload[] = [];
  const nextRequest =
    "cookies" in request &&
    typeof (request as NextRequest).cookies?.getAll === "function"
      ? (request as NextRequest)
      : null;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        if (nextRequest) return nextRequest.cookies.getAll();
        return parseCookieHeader(request.headers.get("cookie") ?? "");
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          pending.push(cookie);
          nextRequest?.cookies.set(cookie.name, cookie.value);
        }
      },
    },
  });

  function withCookies(response: NextResponse): NextResponse {
    for (const { name, value, options } of pending) {
      response.cookies.set(name, value, options);
    }
    return response;
  }

  return { supabase, withCookies };
}
