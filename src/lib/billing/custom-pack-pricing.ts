import type { BillingInterval } from "@/lib/billing/plan-catalog";

export const CUSTOM_TOKEN_MIN = 200;
export const CUSTOM_TOKEN_MAX = 5000;
export const CUSTOM_MIN_CHARGE_CENTS = 1500;
/** 5¢ per token (monthly basis). */
export const CUSTOM_CENTS_PER_TOKEN = 5;

const ANNUAL_MONTHS_CHARGED = 10;
const ANNUAL_MONTHS_GRANTED = 12;

export function computeCustomPack(
  requestedTokens: number,
  interval: BillingInterval,
): { tokenAmount: number; amountCents: number } {
  const tokens = Math.round(requestedTokens);
  if (tokens < CUSTOM_TOKEN_MIN || tokens > CUSTOM_TOKEN_MAX) {
    throw new Error(
      `Custom packs must be between ${CUSTOM_TOKEN_MIN} and ${CUSTOM_TOKEN_MAX} tokens`,
    );
  }

  let amountCents = tokens * CUSTOM_CENTS_PER_TOKEN;
  if (amountCents < CUSTOM_MIN_CHARGE_CENTS) {
    amountCents = CUSTOM_MIN_CHARGE_CENTS;
  }

  let tokenAmount = tokens;
  if (interval === "annual") {
    tokenAmount = tokens * ANNUAL_MONTHS_GRANTED;
    amountCents = tokens * ANNUAL_MONTHS_CHARGED * CUSTOM_CENTS_PER_TOKEN;
    if (amountCents < CUSTOM_MIN_CHARGE_CENTS * ANNUAL_MONTHS_CHARGED) {
      amountCents = CUSTOM_MIN_CHARGE_CENTS * ANNUAL_MONTHS_CHARGED;
    }
  }

  return { tokenAmount, amountCents };
}
