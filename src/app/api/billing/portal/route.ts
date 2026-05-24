import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { getStripeClient } from "@/lib/billing/stripe-client";
import { getServerSupabaseEnv } from "@/lib/supabase/env";
import { getStripeCustomerIdForUser } from "@/lib/db/repositories/subscriptions";

export async function POST() {
  return withAuth(null, async (user) => {
    const { BILLING_MODE, NEXT_PUBLIC_SITE_URL } = getServerSupabaseEnv();
    if (BILLING_MODE !== "stripe") {
      return NextResponse.json(
        { error: "Stripe billing portal is only available in Stripe mode." },
        { status: 400 },
      );
    }

    const customerId = await getStripeCustomerIdForUser(user.id);
    if (!customerId) {
      return NextResponse.json(
        { error: "No Stripe customer on file. Complete a checkout first." },
        { status: 404 },
      );
    }

    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/billing`,
    });

    return NextResponse.json({ url: session.url });
  });
}
