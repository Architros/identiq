import { getPlan } from "@/lib/db/repositories/billing";
import { getScalePlanPrices } from "@/lib/db/repositories/scale-plan-prices";
import {
  resolveCustomPackFromDb,
  resolvePackFromDb,
} from "@/lib/billing/plan-from-db";
import {
  resolveCustomPack,
  resolvePack,
  WELCOME_OFFER_ENABLED,
  type BillingInterval,
  type PackPlanId,
  type ResolvedPack,
} from "@/lib/billing/plan-catalog";

export type CheckoutRequest = {
  planId: PackPlanId;
  interval?: BillingInterval;
  customTokenAmount?: number;
};

/** Resolves checkout amounts from Supabase `plans` / `plan_scale_prices`. */
export async function resolveCheckoutPack(
  input: CheckoutRequest,
): Promise<ResolvedPack> {
  const interval = input.interval ?? "monthly";

  if (input.planId === "welcome") {
    if (!WELCOME_OFFER_ENABLED) {
      throw new Error("Welcome offer is not available");
    }
    const plan = await getPlan("welcome");
    if (plan) return resolvePackFromDb(plan, "monthly");
    return resolvePack("welcome", "monthly");
  }

  if (input.planId === "custom") {
    if (input.customTokenAmount == null) {
      throw new Error("customTokenAmount is required for custom packs");
    }
    const tier = await getScalePlanPrices(input.customTokenAmount);
    if (!tier) {
      throw new Error(
        `No Scale tier configured for ${input.customTokenAmount} tokens/month in plan_scale_prices`,
      );
    }
    return resolveCustomPackFromDb(tier, interval);
  }

  const plan = await getPlan(input.planId);
  if (!plan) throw new Error("Plan not found");
  return resolvePackFromDb(plan, interval);
}
