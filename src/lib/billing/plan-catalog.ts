import { computeCustomPack } from "@/lib/billing/custom-pack-pricing";
import {
  formatStoredAssetsLimit,
  PACK_STORED_ASSET_LIMITS,
  resolveCustomPackStorageLimit,
} from "@/lib/billing/storage-entitlement";

export type BillingInterval = "monthly" | "annual";

export type PackPlanId = "starter" | "pro" | "studio" | "welcome" | "custom";

export type PlanBadge = "most_popular" | "best_value";

/** Typical 2K Ideas generation (no reference images) ≈ 4 tokens. */
export const TOKENS_PER_IMAGE_ESTIMATE = 4;

/** When false, the one-time welcome pack is hidden from UI/APIs and checkout is blocked. */
export const WELCOME_OFFER_ENABLED = false;

const ANNUAL_MONTHS_CHARGED = 10;
const ANNUAL_MONTHS_GRANTED = 12;

export type CatalogPackDefinition = {
  id: PackPlanId;
  name: string;
  tagline: string;
  badge?: PlanBadge;
  monthlyTokens: number;
  monthlyPriceCents: number;
  /** Max saved generated assets in the library (Bloom-style cap). */
  storedAssetLimit: number;
  features: string[];
};

const PACK_DEFINITIONS: CatalogPackDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Get started.",
    monthlyTokens: 75,
    monthlyPriceCents: 900,
    storedAssetLimit: PACK_STORED_ASSET_LIMITS.starter,
    features: [
      "75 tokens per pack",
      "Studio presets & library remix",
      "2K image output",
      "Unlimited brands",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Ship daily.",
    badge: "most_popular",
    monthlyTokens: 240,
    monthlyPriceCents: 2900,
    storedAssetLimit: PACK_STORED_ASSET_LIMITS.pro,
    features: [
      "240 tokens per pack",
      "Brand starter pack generation",
      "2K image output",
      "Unlimited brands",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "Run at volume.",
    badge: "best_value",
    monthlyTokens: 400,
    monthlyPriceCents: 4900,
    storedAssetLimit: PACK_STORED_ASSET_LIMITS.studio,
    features: [
      "400 tokens per pack",
      "Highest volume for teams",
      "2K image output",
      "Unlimited brands",
    ],
  },
];

export const WELCOME_PACK = {
  id: "welcome" as const,
  name: "Welcome offer",
  tokenAmount: 40,
  priceCents: 500,
  storedAssetLimit: PACK_STORED_ASSET_LIMITS.welcome,
  features: ["40 tokens", "2K image output", "One-time for new customers"],
};

export { formatStoredAssetsLimit, resolveCustomPackStorageLimit };

export function estimateImages(tokenAmount: number): number {
  return Math.max(1, Math.floor(tokenAmount / TOKENS_PER_IMAGE_ESTIMATE));
}

export function formatUsd(cents: number): string {
  if (cents % 100 === 0) {
    return `$${cents / 100}`;
  }
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatUsdPerMonth(annualCents: number): string {
  const perMonth = annualCents / ANNUAL_MONTHS_CHARGED / 100;
  if (Number.isInteger(perMonth)) {
    return `$${perMonth}`;
  }
  return `$${perMonth.toFixed(2)}`;
}

/** Headline price on plan cards: full period amount with /mo or /yr (not monthly amortization). */
export function formatPlanPrice(
  cents: number,
  interval: BillingInterval,
): string {
  return `${formatUsd(cents)}${interval === "annual" ? "/yr" : "/mo"}`;
}

export function getPackDefinition(planId: PackPlanId): CatalogPackDefinition | null {
  return PACK_DEFINITIONS.find((p) => p.id === planId) ?? null;
}

export function listDisplayPacks(): CatalogPackDefinition[] {
  return PACK_DEFINITIONS;
}

export type ResolvedPack = {
  planId: PackPlanId;
  name: string;
  tokenAmount: number;
  amountCents: number;
  interval: BillingInterval;
};

export function resolvePack(
  planId: PackPlanId,
  interval: BillingInterval,
): ResolvedPack {
  if (planId === "welcome") {
    if (interval === "annual") {
      throw new Error("Welcome offer is one-time only");
    }
    return {
      planId: "welcome",
      name: WELCOME_PACK.name,
      tokenAmount: WELCOME_PACK.tokenAmount,
      amountCents: WELCOME_PACK.priceCents,
      interval: "monthly",
    };
  }

  const def = getPackDefinition(planId);
  if (!def) {
    throw new Error("Unknown plan");
  }

  if (interval === "monthly") {
    return {
      planId: def.id,
      name: def.name,
      tokenAmount: def.monthlyTokens,
      amountCents: def.monthlyPriceCents,
      interval,
    };
  }

  return {
    planId: def.id,
    name: def.name,
    tokenAmount: def.monthlyTokens * ANNUAL_MONTHS_GRANTED,
    amountCents: def.monthlyPriceCents * ANNUAL_MONTHS_CHARGED,
    interval,
  };
}

export function resolveCustomPack(
  customTokenAmount: number,
  interval: BillingInterval,
): ResolvedPack {
  const { tokenAmount, amountCents } = computeCustomPack(
    customTokenAmount,
    interval,
  );
  return {
    planId: "custom",
    name: "Custom pack",
    tokenAmount,
    amountCents,
    interval,
  };
}

export type DisplayPack = CatalogPackDefinition & {
  estimatedImages: number;
  displayPriceCents: number;
  displayTokens: number;
  billedLine: string;
  storedAssetLimitLabel: string;
};

export function toDisplayPack(
  def: CatalogPackDefinition,
  interval: BillingInterval,
): DisplayPack {
  const resolved = resolvePack(def.id, interval);
  const estimatedImages = estimateImages(resolved.tokenAmount);

  let billedLine: string;
  if (interval === "annual") {
    billedLine =
      "Billed annually · unused tokens expire after 12 months";
  } else {
    billedLine =
      "Billed monthly · unused tokens expire each billing period";
  }

  const storageLabel = formatStoredAssetsLimit(def.storedAssetLimit);
  const periodTokens =
    interval === "annual"
      ? `${def.monthlyTokens.toLocaleString()}/mo allotment (${resolved.tokenAmount.toLocaleString()} per year)`
      : `${resolved.tokenAmount.toLocaleString()} per month`;
  const features = [
    `${periodTokens} (~${estimateImages(resolved.tokenAmount)} images per ${interval === "annual" ? "year" : "period"})`,
    storageLabel,
    ...def.features.filter(
      (line) =>
        !line.toLowerCase().includes("tokens per pack") &&
        !line.toLowerCase().includes("unlimited brands"),
    ),
    "Unused tokens do not roll over",
    "Unlimited brands",
  ];

  return {
    ...def,
    features,
    estimatedImages,
    displayPriceCents: resolved.amountCents,
    displayTokens: resolved.tokenAmount,
    billedLine,
    storedAssetLimitLabel: storageLabel,
  };
}
