import { type NextRequest, NextResponse } from "next/server";
import { getBillingProvider } from "@/lib/billing";
import { applyBillingAccessCookie } from "@/lib/billing/billing-access-cookie";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler";

/**
 * Stripe (and simulated) checkout success URL.
 * Cookie writes must happen on the Route Handler response, not via RSC `cookies().set`.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const sessionId = url.searchParams.get("session");
  const retried = url.searchParams.get("retried");

  if (!sessionId) {
    return NextResponse.redirect(
      new URL(
        "/billing?checkout=error&message=Missing+checkout+session",
        url.origin,
      ),
    );
  }

  const { supabase, withCookies } = createRouteHandlerSupabase(request);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const next = `/billing/complete?session=${encodeURIComponent(sessionId)}`;
    return withCookies(
      NextResponse.redirect(
        new URL(`/login?next=${encodeURIComponent(next)}`, url.origin),
      ),
    );
  }

  try {
    const billing = getBillingProvider();
    const { balance } = await billing.fulfillCheckout(sessionId, user.id);

    const dest = new URL("/billing", url.origin);
    dest.searchParams.set("checkout", "success");
    dest.searchParams.set("balance", String(balance));
    dest.searchParams.set("session", sessionId);

    const response = NextResponse.redirect(dest);
    applyBillingAccessCookie(response);
    return withCookies(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout could not be completed";
    const dest = new URL("/billing", url.origin);
    dest.searchParams.set("checkout", "error");
    dest.searchParams.set("message", message);
    dest.searchParams.set("session", sessionId);
    if (retried) dest.searchParams.set("retried", "1");
    return withCookies(NextResponse.redirect(dest));
  }
}
