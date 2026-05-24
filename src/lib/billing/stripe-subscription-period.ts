import type Stripe from "stripe";
import type { BillingInterval } from "@/lib/billing/plan-catalog";
import { defaultPeriodEnd } from "@/lib/billing/subscription-grants";

/**
 * Stripe Basil+ moved `current_period_end` from Subscription to SubscriptionItem.
 * Read item-level periods first, then legacy subscription fields, then default.
 */
export function periodEndFromStripeSubscription(
  sub: Stripe.Subscription,
  billingInterval: BillingInterval = "monthly",
): Date {
  const itemEnds = (sub.items?.data ?? [])
    .map((item) => item.current_period_end)
    .filter((end): end is number => typeof end === "number" && end > 0);

  const legacyEnd = (
    sub as Stripe.Subscription & { current_period_end?: number | null }
  ).current_period_end;

  const unix =
    itemEnds.length > 0 ? Math.max(...itemEnds) : legacyEnd ?? undefined;

  if (typeof unix === "number" && unix > 0) {
    const date = new Date(unix * 1000);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return defaultPeriodEnd(billingInterval);
}

export function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}
