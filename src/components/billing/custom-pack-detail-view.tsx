"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { CustomPackVolumeSlider } from "@/components/billing/custom-pack-volume-slider";
import {
  estimateImages,
  formatStoredAssetsLimit,
  formatPlanPrice,
  resolveCustomPackStorageLimit,
  type BillingInterval,
} from "@/lib/billing/plan-catalog";
import {
  computeCustomPackFromTier,
  customPackVolumeSavingsPercent,
  type ScaleTier,
} from "@/lib/billing/scale-tiers";
import { CUSTOM_PACK_TIERS } from "@/lib/billing/custom-pack-pricing";
import { TextureButton } from "@/components/ui/texture-button";
import { TextureOverlay } from "@/components/ui/texture-overlay";
import { cn } from "@/lib/utils";

const CUSTOM_FEATURES = [
  "Shared workspaces & brand assets",
  "Pooled credits for your team",
  "Volume discounts as you scale",
  "Single invoice billing",
  "Unlimited members, no per-seat fees",
] as const;

const DEFAULT_TIER_INDEX = 0;

function fallbackTiers(): ScaleTier[] {
  return CUSTOM_PACK_TIERS.map((t) => ({
    monthlyTokens: t.monthlyTokens,
    monthlyPriceCents: t.monthlyPriceCents,
    annualPriceCents: t.monthlyPriceCents * 10,
  }));
}

type CustomPackDetailViewProps = {
  interval: BillingInterval;
  scaleTiers: ScaleTier[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onBuy: (tokenAmount: number) => void;
};

export function CustomPackDetailView({
  interval,
  scaleTiers,
  loading,
  error,
  onBack,
  onBuy,
}: CustomPackDetailViewProps) {
  const tiers = scaleTiers.length > 0 ? scaleTiers : fallbackTiers();
  const [tierIndex, setTierIndex] = useState(DEFAULT_TIER_INDEX);
  const tier = tiers[Math.min(tierIndex, tiers.length - 1)];
  const monthlyTokens = tier.monthlyTokens;
  const baseline = tiers[0];

  const { tokenAmount, amountCents } = useMemo(
    () => computeCustomPackFromTier(tier, interval),
    [tier, interval],
  );

  const storageLimit = useMemo(
    () => resolveCustomPackStorageLimit(monthlyTokens),
    [monthlyTokens],
  );

  const volumeSavings = customPackVolumeSavingsPercent(tier, baseline);

  const features = useMemo(
    () => [
      formatStoredAssetsLimit(storageLimit),
      ...CUSTOM_FEATURES,
    ],
    [storageLimit],
  );

  const headlinePrice = formatPlanPrice(amountCents, interval);

  const billedLine =
    interval === "annual"
      ? "Billed annually · unused tokens expire after 12 months"
      : "Billed monthly · unused tokens expire each billing period";

  const creditsLabel =
    interval === "annual"
      ? `${tokenAmount.toLocaleString()} tokens per year`
      : `${monthlyTokens.toLocaleString()} tokens per month`;

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <HugeiconsIcon
          icon={ArrowLeft01Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.75}
        />
        View other plans
      </button>

      {error ? (
        <p className="mt-4 rounded-xl border border-destructive-border bg-destructive-muted px-3 py-2 text-sm text-destructive-text">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div>
          <h3 className="font-display text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
            Scale
          </h3>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            Volume pricing for individuals, teams, and agencies that need more
            credits at lower per-credit rates.
          </p>
          <ul className="mt-8 space-y-3">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 text-sm text-foreground"
              >
                <HugeiconsIcon
                  icon={Tick01Icon}
                  size={18}
                  color="currentColor"
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-accent"
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border bg-surface p-6 sm:p-8",
            "border-accent/40 shadow-md ring-1 ring-accent/25",
            "shadow-[0px_1px_0px_0px_hsla(0,0%,0%,0.02)_inset,0px_0px_0px_1px_hsla(0,0%,0%,0.02)_inset,0px_0px_0px_1px_rgba(255,255,255,0.25)]",
          )}
        >
          <TextureOverlay
            texture="diagonal"
            diagonalStep={4}
            lineAngle={45}
            fadeToRight
            opacity={0.88}
            className="text-[#f0f1f4]"
          />

          <div className="relative z-10">
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="font-display text-4xl font-normal tracking-tight text-foreground">
              {headlinePrice}
            </p>
            {interval === "annual" ? (
              <span className="rounded-md bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                2 months free
              </span>
            ) : volumeSavings > 0 ? (
              <span className="rounded-md bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                {volumeSavings}% off
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted">
            {interval === "annual" ? "Billed annually" : billedLine}
          </p>

          <div className="mt-8">
            <p className="text-center text-sm font-semibold text-foreground">
              {creditsLabel}
            </p>
            <p className="mt-1 text-center text-xs text-muted">
              ~{estimateImages(tokenAmount)} images ·{" "}
              {tokenAmount.toLocaleString()} tokens total
            </p>
          </div>

          <CustomPackVolumeSlider
            tierIndex={tierIndex}
            onTierIndexChange={setTierIndex}
            tiers={tiers}
            className="mt-6"
          />

          <TextureButton
            type="button"
            variant="accent"
            shape="card"
            fullWidth
            disabled={loading}
            onClick={() => onBuy(monthlyTokens)}
            className="mt-8"
            innerClassName="flex w-full py-3 text-sm font-semibold"
          >
            {loading ? "…" : "Upgrade"}
          </TextureButton>

          <p className="mt-4 text-center text-xs text-muted">
            <button
              type="button"
              onClick={onBack}
              className="cursor-pointer underline hover:text-foreground"
            >
              View other plans
            </button>
            <span className="mx-1.5">·</span>
            <span>Contact us for more credits</span>
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
