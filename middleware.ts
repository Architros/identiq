import { createServerClient } from "@supabase/ssr";
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
import {
  isAuthCompletionApiPath,
  isPublicApiPath,
  isPublicAppPath,
  loginPathWithNext,
} from "@/lib/auth/protected-paths";
import { userMustSetPassword } from "@/lib/auth/password";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const search = request.nextUrl.search;

  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (!isPublicAppPath(pathname) && !pathname.startsWith("/api/")) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      return NextResponse.redirect(loginUrl);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isPublicAppPath(pathname)) {
    if (pathname === "/login" && user) {
      if (userMustSetPassword(user)) {
        return supabaseResponse;
      }

      let hasAccess = hasBillingAccessCookie(request);
      if (!hasAccess) {
        try {
          hasAccess = await userHasBillingAccess(user.id);
        } catch {
          hasAccess = false;
        }
      }
      const dest = request.nextUrl.clone();
      dest.pathname = hasAccess ? "/" : "/billing";
      if (!hasAccess) {
        dest.searchParams.set("required", "1");
      } else {
        dest.search = "";
      }
      const loginRedirect = NextResponse.redirect(dest);
      if (hasAccess) {
        applyBillingAccessCookie(loginRedirect);
      }
      copyCookies(supabaseResponse, loginRedirect);
      return loginRedirect;
    }
    return supabaseResponse;
  }

  if (!user) {
    if (pathname.startsWith("/api/")) {
      if (isPublicApiPath(pathname)) {
        return supabaseResponse;
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginRedirect = NextResponse.redirect(
      new URL(loginPathWithNext(pathname, search), request.url),
    );
    copyCookies(supabaseResponse, loginRedirect);
    return loginRedirect;
  }

  if (userMustSetPassword(user)) {
    if (
      pathname.startsWith("/api/") &&
      !isAuthCompletionApiPath(pathname) &&
      !pathname.startsWith("/api/auth/")
    ) {
      return NextResponse.json(
        { error: "password_setup_required" },
        { status: 403 },
      );
    }
    const loginRedirect = NextResponse.redirect(
      new URL(loginPathWithNext(pathname, search), request.url),
    );
    copyCookies(supabaseResponse, loginRedirect);
    return loginRedirect;
  }

  let hasAccess = hasBillingAccessCookie(request);
  let accessCheckFailed = false;

  if (!hasAccess) {
    try {
      hasAccess = await userHasBillingAccess(user.id);
      if (hasAccess) {
        applyBillingAccessCookie(supabaseResponse);
      }
    } catch (err) {
      console.error("[billing-gate] access check failed:", err);
      accessCheckFailed = true;
      hasAccess = hasBillingAccessCookie(request);
    }
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
    copyCookies(supabaseResponse, billingRedirect);
    return billingRedirect;
  }

  if (!hasAccess) {
    if (pathname.startsWith("/api/")) {
      if (isBillingGateExemptApi(pathname)) {
        return supabaseResponse;
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
        return supabaseResponse;
      }
      const billingRedirect = NextResponse.redirect(
        billingRequiredUrl(request.nextUrl.origin),
      );
      copyCookies(supabaseResponse, billingRedirect);
      return billingRedirect;
    }
  }

  if (hasAccess) {
    applyBillingAccessCookie(supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
