import type { BillingInterval } from "@/lib/billing/plan-catalog";
import type { PlanRow } from "@/lib/db/types";

type SubscriptionLineItem = {
  price: string;
  quantity: number;
};

export function resolveStripePriceId(
  plan: PlanRow | null,
  interval: BillingInterval,
  scaleStripePriceId?: string | null,
): string | null {
  if (!plan) return null;
  if (plan.id === "custom") {
    return scaleStripePriceId ?? null;
  }
  if (interval === "annual") {
    return plan.stripe_price_id_annual ?? null;
  }
  return plan.stripe_price_id ?? null;
}

/** Stripe Checkout `mode: subscription` requires recurring Price IDs. */
export function buildStripeSubscriptionLineItems(
  plan: PlanRow | null,
  interval: BillingInterval,
  scaleStripePriceId?: string | null,
): SubscriptionLineItem[] {
  const priceId = resolveStripePriceId(plan, interval, scaleStripePriceId);
  if (!priceId) {
    const hint =
      plan?.id === "custom"
        ? "Set stripe_price_id / stripe_price_id_annual on plan_scale_prices for this tier."
        : "Set stripe_price_id / stripe_price_id_annual on public.plans.";
    throw new Error(
      `Missing Stripe recurring price for plan "${plan?.id ?? "unknown"}" (${interval}). ${hint}`,
    );
  }
  return [{ price: priceId, quantity: 1 }];
}
