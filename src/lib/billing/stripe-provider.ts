import type { BillingProvider } from "@/lib/billing/provider";
import { getServerSupabaseEnv } from "@/lib/supabase/env";

function requireStripeKeys() {
  const env = getServerSupabaseEnv();
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY is required when BILLING_MODE=stripe. Add keys from the Stripe Dashboard.",
    );
  }
  return env;
}

export const stripeBillingProvider: BillingProvider = {
  async createCheckoutSession() {
    requireStripeKeys();
    throw new Error("Stripe checkout is not wired yet. Set BILLING_MODE=simulated.");
  },

  async fulfillCheckout() {
    requireStripeKeys();
    throw new Error("Stripe fulfillment is not wired yet.");
  },

  async handleWebhook(rawBody, signature) {
    const env = requireStripeKeys();
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET is required for Stripe webhooks.");
    }
    if (!signature) {
      throw new Error("Missing Stripe signature header.");
    }
    // Wire stripe.webhooks.constructEvent when going live.
    void rawBody;
    throw new Error("Stripe webhook handler is not implemented yet.");
  },
};
