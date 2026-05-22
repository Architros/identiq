export type StoragePackId = "starter" | "pro" | "studio" | "welcome" | "custom";

/** Default for accounts with no token pack purchase (Bloom-style free tier). */
export const DEFAULT_FREE_ASSET_STORAGE_LIMIT = 25;

/** Stored generated assets (library) per pack tier — Bloom-style caps, not subscriptions. */
export const PACK_STORED_ASSET_LIMITS: Record<
  Exclude<StoragePackId, "custom">,
  number
> = {
  welcome: 50,
  starter: 150,
  pro: 500,
  studio: 2_000,
};

export function formatStoredAssetsLimit(limit: number): string {
  if (limit >= 10_000) return "Unlimited stored assets";
  return `${limit.toLocaleString()} stored assets`;
}

/** Custom pack storage tier from monthly token slider (annual uses same basis). */
export function resolveCustomPackStorageLimit(monthlyTokenBasis: number): number {
  const tokens = Math.round(monthlyTokenBasis);
  if (tokens >= 1_000) return PACK_STORED_ASSET_LIMITS.studio;
  if (tokens >= 500) return PACK_STORED_ASSET_LIMITS.pro;
  return PACK_STORED_ASSET_LIMITS.starter;
}

export function resolveStorageLimitForPlan(
  planId: StoragePackId,
  options?: { customMonthlyTokenBasis?: number },
): number {
  if (planId === "custom") {
    const basis = options?.customMonthlyTokenBasis;
    if (basis == null) {
      throw new Error("customMonthlyTokenBasis is required for custom packs");
    }
    return resolveCustomPackStorageLimit(basis);
  }
  return PACK_STORED_ASSET_LIMITS[planId];
}

/** Infer monthly slider value from granted custom tokens (12× for annual packs). */
export function monthlyTokenBasisFromGrantedCustomTokens(
  grantedTokens: number,
): number {
  const tokens = Math.round(grantedTokens);
  if (tokens >= 2_400 && tokens % 12 === 0) {
    return tokens / 12;
  }
  return tokens;
}

export function mergeStorageLimits(current: number, purchased: number): number {
  return Math.max(current, purchased);
}
