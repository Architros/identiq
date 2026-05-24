import { type NextRequest, NextResponse } from "next/server";
import {
  applyBillingAccessCookie,
  hasBillingAccessCookie,
} from "@/lib/billing/billing-access-cookie";
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
  "/privacy",
  "/terms",
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

  let hasAccess = hasBillingAccessCookie(request);
  let accessCheckFailed = false;

  if (!hasAccess) {
    try {
      hasAccess = await userHasBillingAccess(user.id);
      if (hasAccess) {
        applyBillingAccessCookie(response);
      }
    } catch (err) {
      console.error("[billing-gate] access check failed:", err);
      accessCheckFailed = true;
      hasAccess = hasBillingAccessCookie(request);
    }
  }

  if (pathname === "/login") {
    const dest = request.nextUrl.clone();
    if (hasAccess) {
      dest.pathname = "/";
      dest.search = "";
    } else {
      dest.pathname = "/billing";
      dest.searchParams.set("required", "1");
    }
    const loginRedirect = NextResponse.redirect(dest);
    if (hasAccess) {
      applyBillingAccessCookie(loginRedirect);
    }
    return loginRedirect;
  }

  if (
    hasAccess &&
    pathname === "/billing" &&
    request.nextUrl.searchParams.get("required") === "1" &&
    !request.nextUrl.searchParams.get("checkout")
  ) {
    const dest = request.nextUrl.clone();
    dest.searchParams.delete("required");
    const billingRedirect = NextResponse.redirect(dest);
    applyBillingAccessCookie(billingRedirect);
    return billingRedirect;
  }

  if (!hasAccess) {
    if (pathname.startsWith("/api/")) {
      if (isBillingGateExemptApi(pathname)) {
        return response;
      }
      if (accessCheckFailed) {
        return NextResponse.json(
          { error: "service_unavailable" },
          { status: 503 },
        );
      }
      return NextResponse.json(
        { error: "subscription_required" },
        { status: 403 },
      );
    }

    if (!isBillingGateExemptPath(pathname)) {
      if (accessCheckFailed) {
        return response;
      }
      return NextResponse.redirect(billingRequiredUrl(request.nextUrl.origin));
    }
  }

  if (hasAccess) {
    applyBillingAccessCookie(response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
