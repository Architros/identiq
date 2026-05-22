"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import {
  computeCustomPack,
  CUSTOM_TOKEN_MAX,
  CUSTOM_TOKEN_MIN,
} from "@/lib/billing/custom-pack-pricing";
import {
  estimateImages,
  formatStoredAssetsLimit,
  formatUsd,
  formatUsdPerMonth,
  resolveCustomPackStorageLimit,
  type BillingInterval,
} from "@/lib/billing/plan-catalog";
import { cn } from "@/lib/utils";

type CustomPackPanelProps = {
  interval: BillingInterval;
  loading: boolean;
  onBuy: (tokenAmount: number) => void;
};

const CUSTOM_FEATURE_BASE = [
  "Pick your token amount",
  "2K image output",
  "Studio, library & brand wizard",
  "Unlimited brands",
] as const;

export function CustomPackPanel({
  interval,
  loading,
  onBuy,
}: CustomPackPanelProps) {
  const [tokens, setTokens] = useState(500);

  const { tokenAmount, amountCents } = useMemo(
    () => computeCustomPack(tokens, interval),
    [tokens, interval],
  );

  const storageLimit = useMemo(
    () => resolveCustomPackStorageLimit(tokens),
    [tokens],
  );

  const customFeatures = useMemo(
    () => [
      CUSTOM_FEATURE_BASE[0],
      formatStoredAssetsLimit(storageLimit),
      ...CUSTOM_FEATURE_BASE.slice(1),
    ],
    [storageLimit],
  );

  const headlinePrice =
    interval === "annual"
      ? `${formatUsdPerMonth(amountCents)}/mo`
      : formatUsd(amountCents);

  const billedLine =
    interval === "annual"
      ? `${formatUsd(amountCents)} billed once · 12× monthly tokens · 2 months free`
      : "One-time custom pack";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Custom</h3>
        <p className="mt-3 font-display text-3xl font-normal tracking-tight text-foreground">
          {headlinePrice}
        </p>
        <p className="mt-1 text-xs text-muted">{billedLine}</p>
        <p className="mt-2 text-sm text-muted">Volume pricing at your pace.</p>
      </div>

      <div className="mt-5 space-y-3">
        <label className="block text-xs font-medium text-muted">
          Tokens in pack
          <span className="ml-1 font-normal">
            ({CUSTOM_TOKEN_MIN.toLocaleString()}–{CUSTOM_TOKEN_MAX.toLocaleString()})
          </span>
        </label>
        <input
          type="range"
          min={CUSTOM_TOKEN_MIN}
          max={CUSTOM_TOKEN_MAX}
          step={50}
          value={tokens}
          onChange={(e) => setTokens(Number(e.target.value))}
          className="w-full cursor-pointer accent-accent"
        />
        <p className="text-center text-sm font-semibold text-foreground">
          {tokenAmount.toLocaleString()} tokens (~{estimateImages(tokenAmount)}{" "}
          images)
        </p>
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {customFeatures.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm text-foreground"
          >
            <HugeiconsIcon
              icon={Tick01Icon}
              size={16}
              color="currentColor"
              strokeWidth={2}
              className="mt-0.5 shrink-0 text-accent"
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={loading}
        onClick={() => onBuy(tokens)}
        className={cn(
          "mt-6 w-full cursor-pointer rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-sidebar-active",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {loading ? "…" : "Buy custom pack"}
      </button>
    </div>
  );
}
