"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
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

const SLIDER_MARKS = [200, 500, 1000, 2000, 5000] as const;

const CUSTOM_FEATURES = [
  "Pick your token amount",
  "2K image output",
  "Studio presets & library remix",
  "Brand starter pack generation",
  "Unlimited brands",
] as const;

type CustomPackDetailViewProps = {
  interval: BillingInterval;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onBuy: (tokenAmount: number) => void;
};

export function CustomPackDetailView({
  interval,
  loading,
  error,
  onBack,
  onBuy,
}: CustomPackDetailViewProps) {
  const [tokens, setTokens] = useState(500);

  const { tokenAmount, amountCents } = useMemo(
    () => computeCustomPack(tokens, interval),
    [tokens, interval],
  );

  const storageLimit = useMemo(
    () => resolveCustomPackStorageLimit(tokens),
    [tokens],
  );

  const features = useMemo(
    () => [
      ...CUSTOM_FEATURES.slice(0, 1),
      formatStoredAssetsLimit(storageLimit),
      ...CUSTOM_FEATURES.slice(1),
    ],
    [storageLimit],
  );

  const headlinePrice =
    interval === "annual"
      ? `${formatUsdPerMonth(amountCents)}/mo`
      : formatUsd(amountCents);

  const billedLine =
    interval === "annual"
      ? `${formatUsd(amountCents)} billed once · 12× monthly tokens`
      : "One-time custom pack";

  const monthlyLabel =
    interval === "annual"
      ? `${tokens.toLocaleString()} tokens/mo`
      : `${tokenAmount.toLocaleString()} tokens in pack`;

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
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div>
          <h3 className="font-display text-3xl font-normal tracking-tight text-foreground sm:text-4xl">
            Custom
          </h3>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            Volume pricing for teams and power users. Set your token pack size,
            unlock higher library storage as you scale, and pay once — no
            subscription.
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

        <div className="rounded-2xl border border-border bg-background/60 p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="font-display text-4xl font-normal tracking-tight text-foreground">
              {headlinePrice}
            </p>
            {interval === "annual" ? (
              <span className="rounded-md bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                2 months free
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted">{billedLine}</p>

          <div className="mt-8">
            <p className="text-center text-sm font-semibold text-foreground">
              {monthlyLabel}
            </p>
            <p className="mt-1 text-center text-xs text-muted">
              ~{estimateImages(tokenAmount)} images ·{" "}
              {tokenAmount.toLocaleString()} tokens total
            </p>
            <input
              type="range"
              min={CUSTOM_TOKEN_MIN}
              max={CUSTOM_TOKEN_MAX}
              step={50}
              value={tokens}
              onChange={(e) => setTokens(Number(e.target.value))}
              className="mt-4 w-full cursor-pointer accent-accent"
              aria-label="Tokens in pack"
            />
            <div className="mt-2 flex justify-between text-[11px] text-muted">
              {SLIDER_MARKS.map((mark) => (
                <span key={mark}>{mark >= 1000 ? `${mark / 1000}k` : mark}</span>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => onBuy(tokens)}
            className={cn(
              "mt-8 w-full cursor-pointer rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/90",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {loading ? "…" : "Buy custom pack"}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="mt-4 w-full cursor-pointer text-center text-sm text-muted underline hover:text-foreground"
          >
            View other plans
          </button>
        </div>
      </div>
    </div>
  );
}
