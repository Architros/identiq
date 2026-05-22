import type { BillingInterval } from "@/lib/billing/plan-catalog";

/** Discrete monthly token tiers — slider snaps to these only (agency volume pricing). */
export const CUSTOM_PACK_TIERS = [
  { monthlyTokens: 300, monthlyPriceCents: 3_900 },
  { monthlyTokens: 500, monthlyPriceCents: 5_900 },
  { monthlyTokens: 1_000, monthlyPriceCents: 9_900 },
  { monthlyTokens: 2_000, monthlyPriceCents: 16_900 },
  { monthlyTokens: 5_000, monthlyPriceCents: 34_900 },
] as const;

export type CustomPackTier = (typeof CUSTOM_PACK_TIERS)[number];

export const CUSTOM_TOKEN_MIN = CUSTOM_PACK_TIERS[0].monthlyTokens;
export const CUSTOM_TOKEN_MAX =
  CUSTOM_PACK_TIERS[CUSTOM_PACK_TIERS.length - 1].monthlyTokens;

const ANNUAL_MONTHS_CHARGED = 10;
const ANNUAL_MONTHS_GRANTED = 12;

export function getCustomPackTierIndex(monthlyTokens: number): number {
  const index = CUSTOM_PACK_TIERS.findIndex(
    (t) => t.monthlyTokens === Math.round(monthlyTokens),
  );
  if (index < 0) {
    throw new Error(
      `Custom packs must use one of: ${CUSTOM_PACK_TIERS.map((t) => t.monthlyTokens).join(", ")} tokens`,
    );
  }
  return index;
}

export function getCustomPackTier(monthlyTokens: number): CustomPackTier {
  return CUSTOM_PACK_TIERS[getCustomPackTierIndex(monthlyTokens)];
}

/** Per-token rate at the lowest tier (13¢) — used to show volume savings on higher tiers. */
export function customPackVolumeSavingsPercent(tier: CustomPackTier): number {
  const baseline =
    CUSTOM_PACK_TIERS[0].monthlyPriceCents / CUSTOM_PACK_TIERS[0].monthlyTokens;
  const actual = tier.monthlyPriceCents / tier.monthlyTokens;
  return Math.max(0, Math.round((1 - actual / baseline) * 100));
}

export function computeCustomPack(
  requestedTokens: number,
  interval: BillingInterval,
): { tokenAmount: number; amountCents: number } {
  const tier = getCustomPackTier(requestedTokens);

  let amountCents = tier.monthlyPriceCents;
  let tokenAmount = tier.monthlyTokens;

  if (interval === "annual") {
    tokenAmount = tier.monthlyTokens * ANNUAL_MONTHS_GRANTED;
    amountCents = tier.monthlyPriceCents * ANNUAL_MONTHS_CHARGED;
  }

  return { tokenAmount, amountCents };
}
