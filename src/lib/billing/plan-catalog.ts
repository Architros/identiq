import { computeCustomPack } from "@/lib/billing/custom-pack-pricing";

export type BillingInterval = "monthly" | "annual";

export type PackPlanId = "starter" | "pro" | "studio" | "welcome" | "custom";

export type PlanBadge = "most_popular" | "best_value";

/** Typical 2K Ideas generation ≈ 3 tokens. */
export const TOKENS_PER_IMAGE_ESTIMATE = 3;

const ANNUAL_MONTHS_CHARGED = 10;
const ANNUAL_MONTHS_GRANTED = 12;

export type CatalogPackDefinition = {
  id: PackPlanId;
  name: string;
  tagline: string;
  badge?: PlanBadge;
  monthlyTokens: number;
  monthlyPriceCents: number;
  features: string[];
};

const PACK_DEFINITIONS: CatalogPackDefinition[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Get started.",
    monthlyTokens: 120,
    monthlyPriceCents: 700,
    features: [
      "120 tokens per pack",
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
    monthlyTokens: 550,
    monthlyPriceCents: 2900,
    features: [
      "550 tokens per pack",
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
    monthlyTokens: 1100,
    monthlyPriceCents: 4900,
    features: [
      "1,100 tokens per pack",
      "Highest volume for teams",
      "2K image output",
      "Unlimited brands",
    ],
  },
];

export const WELCOME_PACK = {
  id: "welcome" as const,
  name: "Welcome offer",
  tokenAmount: 80,
  priceCents: 500,
  features: ["80 tokens", "2K image output", "One-time for new customers"],
};

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
};

export function toDisplayPack(
  def: CatalogPackDefinition,
  interval: BillingInterval,
): DisplayPack {
  const resolved = resolvePack(def.id, interval);
  const estimatedImages = estimateImages(resolved.tokenAmount);

  let billedLine: string;
  if (interval === "annual") {
    billedLine = `${formatUsd(resolved.amountCents)} billed once · ${formatUsdPerMonth(resolved.amountCents)}/mo equiv · 2 months free`;
  } else {
    billedLine = "One-time token pack";
  }

  const features = def.features.map((line, i) => {
    if (i === 0) {
      return `${resolved.tokenAmount.toLocaleString()} tokens (~${estimatedImages} images)`;
    }
    return line;
  });

  return {
    ...def,
    features,
    estimatedImages,
    displayPriceCents: resolved.amountCents,
    displayTokens: resolved.tokenAmount,
    billedLine,
  };
}
