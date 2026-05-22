import {
  resolveCustomPack,
  resolvePack,
  WELCOME_PACK,
  type BillingInterval,
  type PackPlanId,
  type ResolvedPack,
} from "@/lib/billing/plan-catalog";

export type CheckoutRequest = {
  planId: PackPlanId;
  interval?: BillingInterval;
  customTokenAmount?: number;
};

export function resolveCheckoutPack(input: CheckoutRequest): ResolvedPack {
  const interval = input.interval ?? "monthly";

  if (input.planId === "welcome") {
    return resolvePack("welcome", "monthly");
  }

  if (input.planId === "custom") {
    if (input.customTokenAmount == null) {
      throw new Error("customTokenAmount is required for custom packs");
    }
    return resolveCustomPack(input.customTokenAmount, interval);
  }

  return resolvePack(input.planId, interval);
}

export { WELCOME_PACK };
