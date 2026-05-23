import "server-only";

import Stripe from "stripe";
import { getServerSupabaseEnv } from "@/lib/supabase/env";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  const env = getServerSupabaseEnv();
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY is required when BILLING_MODE=stripe.",
    );
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return stripeClient;
}
