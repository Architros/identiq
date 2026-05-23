import type { ScalePlanPriceRow } from "@/lib/db/repositories/scale-plan-prices";
import type { BillingInterval } from "@/lib/billing/plan-catalog";

export type ScaleTier = {
  monthlyTokens: number;
  monthlyPriceCents: number;
  annualPriceCents: number;
};

const ANNUAL_MONTHS_GRANTED = 12;

export function scaleRowsToTiers(rows: ScalePlanPriceRow[]): ScaleTier[] {
  return rows.map((r) => ({
    monthlyTokens: r.monthly_tokens,
    monthlyPriceCents: r.monthly_price_cents,
    annualPriceCents: r.annual_price_cents,
  }));
}

export function computeCustomPackFromTier(
  tier: ScaleTier,
  interval: BillingInterval,
): { tokenAmount: number; amountCents: number } {
  if (interval === "annual") {
    return {
      tokenAmount: tier.monthlyTokens * ANNUAL_MONTHS_GRANTED,
      amountCents: tier.annualPriceCents,
    };
  }
  return {
    tokenAmount: tier.monthlyTokens,
    amountCents: tier.monthlyPriceCents,
  };
}

export function customPackVolumeSavingsPercent(
  tier: ScaleTier,
  baseline: ScaleTier,
): number {
  const baseRate = baseline.monthlyPriceCents / baseline.monthlyTokens;
  const actual = tier.monthlyPriceCents / tier.monthlyTokens;
  return Math.max(0, Math.round((1 - actual / baseRate) * 100));
}
