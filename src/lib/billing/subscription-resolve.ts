import type { BillingInterval, PackPlanId } from "@/lib/billing/plan-catalog";
import { getPackDefinition } from "@/lib/billing/plan-catalog";
import {
  isRecurringPlanId,
  normalizeSubscriptionPlanId,
  resolveDisplayStatus,
  type SubscriptionDisplayStatus,
  type SubscriptionSummary,
} from "@/lib/billing/subscription-status";
import type { BillingMode } from "@/lib/supabase/env";

export type CheckoutSnapshot = {
  planId: string;
  billingInterval: BillingInterval | null;
  completedAt: string | null;
  simulated: boolean;
};

export type SubscriptionSnapshot = {
  planId: string | null;
  legacyPlan: string | null;
  billingInterval: BillingInterval | null;
  status: string | null;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
};

function planDisplayName(
  planId: string,
  names: Map<string, string>,
): string {
  if (names.has(planId)) return names.get(planId)!;
  if (planId === "welcome") return "Welcome offer";
  if (planId === "custom") return "Scale";
  const def = getPackDefinition(planId as PackPlanId);
  return def?.name ?? planId;
}

function summaryFromCheckout(
  checkout: CheckoutSnapshot,
  names: Map<string, string>,
  opts: {
    isSimulated: boolean;
    syncNote?: string | null;
  },
): SubscriptionSummary {
  const displayStatus = resolveDisplayStatus({
    planId: checkout.planId,
    status: checkout.planId === "welcome" ? "completed" : null,
    currentPeriodEnd: null,
  });

  return {
    planId: checkout.planId,
    planName: planDisplayName(checkout.planId, names),
    billingInterval: checkout.billingInterval,
    status: checkout.planId === "welcome" ? "completed" : null,
    currentPeriodEnd: null,
    displayStatus,
    isRecurringActive: false,
    hasEverPurchased: true,
    lastPurchaseAt: checkout.completedAt,
    isSimulated: opts.isSimulated,
    syncNote: opts.syncNote ?? null,
  };
}

function summaryFromSubscriptionRow(
  planId: string,
  sub: SubscriptionSnapshot,
  names: Map<string, string>,
  lastPurchaseAt: string | null,
  opts: {
    isSimulated: boolean;
    syncNote?: string | null;
  },
): SubscriptionSummary {
  const status = sub.status;
  const currentPeriodEnd = sub.currentPeriodEnd;
  const displayStatus = resolveDisplayStatus({
    planId,
    status,
    currentPeriodEnd,
  });

  return {
    planId,
    planName: planDisplayName(planId, names),
    billingInterval: sub.billingInterval,
    status,
    currentPeriodEnd,
    displayStatus,
    isRecurringActive:
      displayStatus === "active" || displayStatus === "trialing",
    hasEverPurchased: true,
    lastPurchaseAt,
    isSimulated: opts.isSimulated,
    syncNote: opts.syncNote ?? null,
  };
}

function checkoutIsSimulated(
  checkout: CheckoutSnapshot | null,
  billingMode: BillingMode,
): boolean {
  if (billingMode !== "stripe") return true;
  return checkout?.simulated === true;
}

/**
 * Pure resolution of what the billing UI should show from checkout + subscription snapshots.
 */
export function resolveSubscriptionSummaryFromSnapshots(params: {
  checkout: CheckoutSnapshot | null;
  subscription: SubscriptionSnapshot | null;
  billingMode: BillingMode;
  planNames: Map<string, string>;
}): SubscriptionSummary | null {
  const { checkout, subscription, billingMode, planNames } = params;

  if (!checkout?.planId) {
    return null;
  }

  const lastPurchaseAt = checkout.completedAt;
  const subPlanId = subscription
    ? normalizeSubscriptionPlanId(subscription.planId, subscription.legacyPlan)
    : null;
  const hasStripeSub = Boolean(subscription?.stripeSubscriptionId);
  const isSimulated = checkoutIsSimulated(checkout, billingMode);

  // Stripe-backed recurring: trust synced subscription row.
  if (
    hasStripeSub &&
    subPlanId &&
    isRecurringPlanId(subPlanId) &&
    subscription
  ) {
    return summaryFromSubscriptionRow(subPlanId, subscription, planNames, lastPurchaseAt, {
      isSimulated: false,
    });
  }

  // Latest purchase is welcome (one-time): ignore orphan subscription rows without Stripe.
  if (checkout.planId === "welcome") {
    return summaryFromCheckout(checkout, planNames, {
      isSimulated: checkout.simulated || billingMode !== "stripe",
    });
  }

  // Simulated / dev recurring: show recurring only when checkout matches subscription row.
  if (
    subscription &&
    subPlanId &&
    isRecurringPlanId(subPlanId) &&
    checkout.planId === subPlanId
  ) {
    return summaryFromSubscriptionRow(subPlanId, subscription, planNames, lastPurchaseAt, {
      isSimulated,
    });
  }

  // Orphan or mismatched subscription row: show latest checkout, not false Active recurring.
  if (subPlanId && isRecurringPlanId(subPlanId) && checkout.planId !== subPlanId) {
    const fromCheckout = summaryFromCheckout(checkout, planNames, {
      isSimulated,
      syncNote:
        "Subscription record out of sync — complete checkout again or contact support.",
    });
    const displayStatus: SubscriptionDisplayStatus =
      checkout.planId === "welcome" ? "one_time" : "expired";
    return { ...fromCheckout, displayStatus, isRecurringActive: false };
  }

  // Recurring checkout but no matching subscription row.
  if (isRecurringPlanId(checkout.planId)) {
    return summaryFromCheckout(checkout, planNames, {
      isSimulated,
      syncNote: hasStripeSub
        ? null
        : "Subscription pending — refresh after payment completes.",
    });
  }

  return summaryFromCheckout(checkout, planNames, { isSimulated });
}
