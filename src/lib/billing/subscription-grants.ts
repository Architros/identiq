import type { BillingInterval, PackPlanId } from "@/lib/billing/plan-catalog";
import {
  getPackDefinition,
  WELCOME_PACK,
} from "@/lib/billing/plan-catalog";
import { getCustomPackTier } from "@/lib/billing/custom-pack-pricing";

const ANNUAL_MONTHS_GRANTED = 12;

export type SubscriptionGrant = {
  tokenAmount: number;
  /** Unix ms or ISO — tokens unusable after this instant */
  expiresAt: Date;
  billingInterval: BillingInterval;
};

/** Tokens granted per Stripe billing period. */
export function resolveSubscriptionGrant(
  planId: PackPlanId,
  interval: BillingInterval,
  periodEnd: Date,
  customMonthlyTokenBasis?: number,
): SubscriptionGrant {
  if (planId === "welcome") {
    return {
      tokenAmount: WELCOME_PACK.tokenAmount,
      expiresAt: addMonths(periodEnd, 1),
      billingInterval: "monthly",
    };
  }

  if (planId === "custom") {
    const basis = customMonthlyTokenBasis ?? 500;
    const tier = getCustomPackTier(basis);
    const tokenAmount =
      interval === "annual"
        ? tier.monthlyTokens * ANNUAL_MONTHS_GRANTED
        : tier.monthlyTokens;
    return {
      tokenAmount,
      expiresAt: periodEnd,
      billingInterval: interval,
    };
  }

  const def = getPackDefinition(planId);
  if (!def) throw new Error("Unknown plan");

  if (interval === "annual") {
    return {
      tokenAmount: def.monthlyTokens * ANNUAL_MONTHS_GRANTED,
      expiresAt: periodEnd,
      billingInterval: "annual",
    };
  }

  return {
    tokenAmount: def.monthlyTokens,
    expiresAt: periodEnd,
    billingInterval: "monthly",
  };
}

/** Default period end when simulating or missing Stripe period. */
export function defaultPeriodEnd(interval: BillingInterval): Date {
  return interval === "annual" ? addMonths(new Date(), 12) : addMonths(new Date(), 1);
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function isSubscriptionPlan(planId: PackPlanId): boolean {
  return planId !== "welcome";
}
