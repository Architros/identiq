import type { BillingInterval } from "@/lib/billing/plan-catalog";

/** Legacy `subscriptions.plan` values that are not real product plans. */
const NON_PLAN_IDS = new Set(["free", ""]);

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
]);

export function normalizeSubscriptionPlanId(
  planId: string | null | undefined,
  legacyPlan: string | null | undefined,
): string | null {
  const fromId = planId?.trim();
  if (fromId && !NON_PLAN_IDS.has(fromId)) return fromId;

  const fromLegacy = legacyPlan?.trim();
  if (fromLegacy && !NON_PLAN_IDS.has(fromLegacy)) return fromLegacy;

  return null;
}

export function isRecurringPlanId(planId: string): boolean {
  return planId !== "welcome";
}

export function isSubscriptionStatusActive(
  status: string | null | undefined,
  currentPeriodEnd: string | null | undefined,
): boolean {
  if (!status || !ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
    return false;
  }
  if (currentPeriodEnd) {
    return new Date(currentPeriodEnd).getTime() > Date.now();
  }
  return true;
}

export function isSubscriptionExpired(
  status: string | null | undefined,
  currentPeriodEnd: string | null | undefined,
): boolean {
  if (currentPeriodEnd) {
    return new Date(currentPeriodEnd).getTime() <= Date.now();
  }
  if (!status) return false;
  return ["canceled", "cancelled", "unpaid", "incomplete_expired", "paused"].includes(
    status,
  );
}

export type SubscriptionDisplayStatus =
  | "active"
  | "expired"
  | "canceled"
  | "past_due"
  | "trialing"
  | "one_time"
  | "none";

export function resolveDisplayStatus(params: {
  planId: string;
  status: string | null | undefined;
  currentPeriodEnd: string | null | undefined;
}): SubscriptionDisplayStatus {
  if (params.planId === "welcome") {
    return "one_time";
  }
  if (params.status === "past_due") {
    if (
      params.currentPeriodEnd &&
      new Date(params.currentPeriodEnd).getTime() <= Date.now()
    ) {
      return "expired";
    }
    return "past_due";
  }
  if (params.status === "trialing") {
    if (
      params.currentPeriodEnd &&
      new Date(params.currentPeriodEnd).getTime() <= Date.now()
    ) {
      return "expired";
    }
    return "trialing";
  }
  if (params.status === "canceled" || params.status === "cancelled") {
    return "canceled";
  }
  if (isSubscriptionExpired(params.status, params.currentPeriodEnd)) {
    return "expired";
  }
  if (
    params.status &&
    ACTIVE_SUBSCRIPTION_STATUSES.has(params.status) &&
    params.status !== "past_due"
  ) {
    if (!params.currentPeriodEnd) {
      return "expired";
    }
    if (isSubscriptionStatusActive(params.status, params.currentPeriodEnd)) {
      return "active";
    }
    return "expired";
  }
  return "expired";
}

export function formatSubscriptionStatusLabel(
  displayStatus: SubscriptionDisplayStatus,
): string {
  switch (displayStatus) {
    case "active":
      return "Active";
    case "expired":
      return "Expired";
    case "canceled":
      return "Canceled";
    case "past_due":
      return "Past due";
    case "trialing":
      return "Trial";
    case "one_time":
      return "One-time purchase";
    default:
      return "No plan";
  }
}

export type SubscriptionSummary = {
  planId: string | null;
  planName: string | null;
  billingInterval: BillingInterval | null;
  /** Raw Stripe / DB status when recurring. */
  status: string | null;
  currentPeriodEnd: string | null;
  displayStatus: SubscriptionDisplayStatus;
  /** True when the recurring period is currently valid. */
  isRecurringActive: boolean;
  /** User completed at least one paid checkout (any pack). */
  hasEverPurchased: boolean;
  /** Last purchase date (checkout completed_at) when known. */
  lastPurchaseAt: string | null;
  /** Dev/simulated purchase (not a live Stripe subscription). */
  isSimulated?: boolean;
  /** Shown when DB checkout and subscription rows disagree. */
  syncNote?: string | null;
};
