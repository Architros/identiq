import { NextResponse } from "next/server";
import { getBillingProvider } from "@/lib/billing";
import { getServerSupabaseEnv } from "@/lib/supabase/env";

export async function POST(request: Request) {
  const env = getServerSupabaseEnv();
  if (env.BILLING_MODE !== "stripe") {
    return NextResponse.json({ received: true, mode: "simulated" });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  try {
    const billing = getBillingProvider();
    await billing.handleWebhook(rawBody, signature);
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
