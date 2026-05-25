import { NextResponse } from "next/server";
import { z } from "zod";
import { getBillingProvider } from "@/lib/billing";
import { applyBillingAccessCookie } from "@/lib/billing/billing-access-cookie";
import { createRouteHandlerSupabase } from "@/lib/supabase/route-handler";

const bodySchema = z.object({
  sessionId: z.string().uuid(),
});

/** Client fallback when redirect on /billing/complete is not used. */
export async function POST(request: Request) {
  const { supabase, withCookies } = createRouteHandlerSupabase(request);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return withCookies(
      NextResponse.json({ error: "Invalid JSON" }, { status: 400 }),
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return withCookies(
      NextResponse.json({ error: "Invalid session" }, { status: 400 }),
    );
  }

  try {
    const billing = getBillingProvider();
    const { balance } = await billing.fulfillCheckout(
      parsed.data.sessionId,
      user.id,
    );

    const res = NextResponse.json({ balance, completed: true });
    applyBillingAccessCookie(res);
    return withCookies(res);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout could not be completed";
    return withCookies(
      NextResponse.json({ error: message }, { status: 400 }),
    );
  }
}
