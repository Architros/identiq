import type { PackPlanId } from "@/lib/billing/plan-catalog";
import {
  DEFAULT_FREE_ASSET_STORAGE_LIMIT,
  mergeStorageLimits,
  monthlyTokenBasisFromGrantedCustomTokens,
  resolvePlanStoredAssetLimit,
} from "@/lib/billing/storage-entitlement";
import { normalizeSubscriptionPlanId } from "@/lib/billing/subscription-status";
import { getPlan } from "@/lib/db/repositories/billing";
import { upgradeUserAssetStorageLimit } from "@/lib/db/repositories/entitlements";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Highest library storage the user should have from completed checkouts and
 * subscription tier. Returns null when they have never purchased.
 */
export async function resolvePurchasedStorageLimit(
  userId: string,
): Promise<number | null> {
  const admin = createServiceRoleClient();

  const { count, error: countError } = await admin
    .from("billing_checkout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  if (countError || (count ?? 0) === 0) {
    return null;
  }

  let maxLimit = DEFAULT_FREE_ASSET_STORAGE_LIMIT;

  const { data: checkouts } = await admin
    .from("billing_checkout_sessions")
    .select("plan_id, token_amount")
    .eq("user_id", userId)
    .eq("status", "completed");

  for (const row of checkouts ?? []) {
    const planId = row.plan_id as PackPlanId | null;
    if (!planId) continue;
    const plan = await getPlan(planId);
    const customBasis =
      planId === "custom"
        ? monthlyTokenBasisFromGrantedCustomTokens(
            (row.token_amount as number) ?? 0,
          )
        : undefined;
    const limit = resolvePlanStoredAssetLimit(planId, plan?.asset_storage_limit, {
      customMonthlyTokenBasis: customBasis,
    });
    maxLimit = mergeStorageLimits(maxLimit, limit);
  }

  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan_id, plan")
    .eq("user_id", userId)
    .maybeSingle();

  const subPlanId = normalizeSubscriptionPlanId(
    sub?.plan_id as string | null,
    sub?.plan as string | null,
  ) as PackPlanId | null;

  if (subPlanId) {
    const plan = await getPlan(subPlanId);
    const limit = resolvePlanStoredAssetLimit(
      subPlanId,
      plan?.asset_storage_limit,
    );
    maxLimit = mergeStorageLimits(maxLimit, limit);
  }

  return maxLimit;
}

/** Ensures profile.asset_storage_limit matches purchased packs (repairs missed webhooks). */
export async function syncUserStorageLimitFromPurchases(
  userId: string,
): Promise<number> {
  const purchased = await resolvePurchasedStorageLimit(userId);
  if (purchased == null) {
    const admin = createServiceRoleClient();
    const { data } = await admin
      .from("profiles")
      .select("asset_storage_limit")
      .eq("id", userId)
      .single();
    return data?.asset_storage_limit ?? DEFAULT_FREE_ASSET_STORAGE_LIMIT;
  }
  return upgradeUserAssetStorageLimit(userId, purchased);
}
