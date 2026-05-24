import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import {
  DEFAULT_FREE_ASSET_STORAGE_LIMIT,
  mergeStorageLimits,
} from "@/lib/billing/storage-entitlement";
import { resolvePurchasedStorageLimit } from "@/lib/db/repositories/storage-sync";

export type AssetStorageEntitlement = {
  limit: number;
  used: number;
  remaining: number;
};

export async function countUserSavedAssets(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("generated_assets")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "saved");

  if (error) return 0;
  return count ?? 0;
}

export async function getUserAssetStorageLimit(
  userId: string,
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("asset_storage_limit")
    .eq("id", userId)
    .single();

  if (error || data?.asset_storage_limit == null) {
    return DEFAULT_FREE_ASSET_STORAGE_LIMIT;
  }
  return data.asset_storage_limit as number;
}

async function getUserAssetStorageLimitAdmin(userId: string): Promise<number> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("profiles")
    .select("asset_storage_limit")
    .eq("id", userId)
    .single();

  if (error || data?.asset_storage_limit == null) {
    return DEFAULT_FREE_ASSET_STORAGE_LIMIT;
  }
  return data.asset_storage_limit as number;
}

export async function upgradeUserAssetStorageLimit(
  userId: string,
  purchasedLimit: number,
): Promise<number> {
  const admin = createServiceRoleClient();
  const current = await getUserAssetStorageLimitAdmin(userId);
  const next = mergeStorageLimits(current, purchasedLimit);
  if (next === current) return next;

  const { error } = await admin
    .from("profiles")
    .update({ asset_storage_limit: next })
    .eq("id", userId);

  if (error) throw error;
  return next;
}

/** Profile limit merged with purchased/subscription catalog (repairs stale 25 after checkout). */
export async function resolveEffectiveAssetStorageLimit(
  userId: string,
): Promise<number> {
  const [profileLimit, purchasedLimit] = await Promise.all([
    getUserAssetStorageLimit(userId),
    resolvePurchasedStorageLimit(userId),
  ]);

  if (purchasedLimit == null) {
    return profileLimit;
  }

  const effective = mergeStorageLimits(profileLimit, purchasedLimit);
  if (effective > profileLimit) {
    return upgradeUserAssetStorageLimit(userId, purchasedLimit);
  }
  return effective;
}

export async function getAssetStorageEntitlement(
  userId: string,
): Promise<AssetStorageEntitlement> {
  const limit = await resolveEffectiveAssetStorageLimit(userId);
  const used = await countUserSavedAssets(userId);
  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
  };
}

export class AssetStorageQuotaError extends Error {
  readonly code = "ASSET_STORAGE_LIMIT";
  readonly status = 403;

  constructor(
    public readonly used: number,
    public readonly limit: number,
    public readonly requested: number,
  ) {
    super(
      `Asset library is full (${used}/${limit}). Upgrade your token pack for more storage.`,
    );
    this.name = "AssetStorageQuotaError";
  }
}

export async function assertCanStoreMoreAssets(
  userId: string,
  additionalCount: number,
): Promise<void> {
  if (additionalCount <= 0) return;
  const { limit, used } = await getAssetStorageEntitlement(userId);
  if (used + additionalCount > limit) {
    throw new AssetStorageQuotaError(used, limit, additionalCount);
  }
}
