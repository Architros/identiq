import type { PlanRow } from "@/lib/db/types";
import type { ScalePlanPriceRow } from "@/lib/db/repositories/scale-plan-prices";
import {
  estimateImages,
  formatStoredAssetsLimit,
  type BillingInterval,
  type CatalogPackDefinition,
  type DisplayPack,
  type PackPlanId,
  type PlanBadge,
  type ResolvedPack,
} from "@/lib/billing/plan-catalog";
import { PACK_STORED_ASSET_LIMITS } from "@/lib/billing/storage-entitlement";

const ANNUAL_MONTHS_CHARGED = 10;
const ANNUAL_MONTHS_GRANTED = 12;

const CATALOG_BY_ID: Record<
  Exclude<PackPlanId, "welcome" | "custom">,
  { tagline: string; badge?: PlanBadge; features: string[] }
> = {
  starter: {
    tagline: "Get started.",
    features: [
      "Studio presets & library remix",
      "2K image output",
      "Unlimited brands",
    ],
  },
  pro: {
    tagline: "Ship daily.",
    badge: "most_popular",
    features: [
      "Brand starter pack generation",
      "2K image output",
      "Unlimited brands",
    ],
  },
  studio: {
    tagline: "Run at volume.",
    badge: "best_value",
    features: [
      "Highest volume for teams",
      "2K image output",
      "Unlimited brands",
    ],
  },
};

export function resolvePackFromDb(
  plan: PlanRow,
  interval: BillingInterval,
): ResolvedPack {
  const planId = plan.id as PackPlanId;
  const monthlyTokens = plan.token_amount;
  const monthlyCents = plan.price_cents;

  if (interval === "monthly") {
    return {
      planId,
      name: plan.name,
      tokenAmount: monthlyTokens,
      amountCents: monthlyCents,
      interval,
    };
  }

  return {
    planId,
    name: plan.name,
    tokenAmount: monthlyTokens * ANNUAL_MONTHS_GRANTED,
    amountCents: monthlyCents * ANNUAL_MONTHS_CHARGED,
    interval: "annual",
  };
}

export function resolveCustomPackFromDb(
  tier: ScalePlanPriceRow,
  interval: BillingInterval,
): ResolvedPack {
  let tokenAmount = tier.monthly_tokens;
  let amountCents = tier.monthly_price_cents;

  if (interval === "annual") {
    tokenAmount = tier.monthly_tokens * ANNUAL_MONTHS_GRANTED;
    amountCents = tier.annual_price_cents;
  }

  return {
    planId: "custom",
    name: "Scale",
    tokenAmount,
    amountCents,
    interval,
  };
}

export function toDisplayPackFromDb(
  plan: PlanRow,
  interval: BillingInterval,
): DisplayPack | null {
  const planId = plan.id as PackPlanId;
  if (planId === "welcome" || planId === "custom") return null;

  const catalog = CATALOG_BY_ID[planId as keyof typeof CATALOG_BY_ID];
  if (!catalog) return null;

  const resolved = resolvePackFromDb(plan, interval);
  const storedAssetLimit =
    plan.asset_storage_limit ??
    PACK_STORED_ASSET_LIMITS[planId as keyof typeof PACK_STORED_ASSET_LIMITS] ??
    PACK_STORED_ASSET_LIMITS.starter;

  const billedLine =
    interval === "annual"
      ? "Billed annually · unused tokens expire after 12 months"
      : "Billed monthly · unused tokens expire each billing period";

  const periodTokens =
    interval === "annual"
      ? `${plan.token_amount.toLocaleString()}/mo allotment (${resolved.tokenAmount.toLocaleString()} per year)`
      : `${resolved.tokenAmount.toLocaleString()} per month`;

  const features = [
    `${periodTokens} (~${estimateImages(resolved.tokenAmount)} images per ${interval === "annual" ? "year" : "period"})`,
    formatStoredAssetsLimit(storedAssetLimit),
    ...catalog.features,
    "Unused tokens do not roll over",
    "Unlimited brands",
  ];

  const def: CatalogPackDefinition = {
    id: planId,
    name: plan.name,
    tagline: catalog.tagline,
    badge: catalog.badge,
    monthlyTokens: plan.token_amount,
    monthlyPriceCents: plan.price_cents,
    storedAssetLimit,
    features: catalog.features,
  };

  return {
    ...def,
    features,
    estimatedImages: estimateImages(resolved.tokenAmount),
    displayPriceCents: resolved.amountCents,
    displayTokens: resolved.tokenAmount,
    billedLine,
    storedAssetLimitLabel: formatStoredAssetsLimit(storedAssetLimit),
  };
}

export function listSubscriptionDisplayPacksFromDb(
  dbPlans: PlanRow[],
  interval: BillingInterval,
): DisplayPack[] {
  const order: PackPlanId[] = ["starter", "pro", "studio"];
  return order
    .map((id) => {
      const row = dbPlans.find((p) => p.id === id);
      if (!row) return null;
      return toDisplayPackFromDb(row, interval);
    })
    .filter((p): p is DisplayPack => p != null);
}

export function welcomeDisplayFromDb(
  plan: PlanRow | null,
): DisplayPack | null {
  if (!plan || plan.id !== "welcome") return null;
  const resolved = resolvePackFromDb(plan, "monthly");
  const storedAssetLimit =
    plan.asset_storage_limit ?? PACK_STORED_ASSET_LIMITS.welcome;

  return {
    id: "welcome",
    name: plan.name,
    tagline: "One-time for new customers",
    monthlyTokens: plan.token_amount,
    monthlyPriceCents: plan.price_cents,
    storedAssetLimit,
    features: [
      `${plan.token_amount} tokens`,
      "2K image output",
      "One-time for new customers",
    ],
    estimatedImages: estimateImages(resolved.tokenAmount),
    displayPriceCents: resolved.amountCents,
    displayTokens: resolved.tokenAmount,
    billedLine: "One-time · tokens expire 1 month after purchase if unused",
    storedAssetLimitLabel: formatStoredAssetsLimit(storedAssetLimit),
  };
}
