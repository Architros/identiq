import { type NextRequest, NextResponse } from "next/server";
import {
  billingRequiredUrl,
  isBillingGateExemptApi,
  isBillingGateExemptPath,
} from "@/lib/billing/billing-gate";
import { userHasBillingAccess } from "@/lib/billing/check-billing-access";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/signout",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  if (pathname === "/api/billing/webhook") return true;
  if (pathname === "/api/auth/otp/send") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return updateSession(request);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return updateSession(request);
  }

  const response = await updateSession(request);

  const supabase = await import("@supabase/ssr").then(({ createServerClient }) =>
    createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }),
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    const next =
      pathname === "/" || pathname === "/login" ? "/" : pathname;
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  let hasAccess = false;
  try {
    hasAccess = await userHasBillingAccess(user.id);
  } catch (err) {
    console.error("[billing-gate] access check failed:", err);
    hasAccess = false;
  }

  if (pathname === "/login") {
    const dest = request.nextUrl.clone();
    dest.pathname = hasAccess ? "/" : "/billing";
    dest.search = hasAccess ? "" : "required=1";
    return NextResponse.redirect(dest);
  }

  if (!hasAccess) {
    if (pathname.startsWith("/api/")) {
      if (isBillingGateExemptApi(pathname)) {
        return response;
      }
      return NextResponse.json(
        { error: "subscription_required" },
        { status: 403 },
      );
    }

    if (!isBillingGateExemptPath(pathname)) {
      return NextResponse.redirect(billingRequiredUrl(request.nextUrl.origin));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
