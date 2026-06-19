"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import type { BillingInterval } from "@/lib/billing/plan-catalog";
import { formatUsd } from "@/lib/billing/plan-catalog";
import type { ScaleTier } from "@/lib/billing/scale-tiers";
import { TextureButton } from "@/components/ui/texture-button";
import { cn } from "@/lib/utils";

type CustomPackTeaserCardProps = {
  interval: BillingInterval;
  scaleTiers: ScaleTier[];
  onCustomize: () => void;
};

const TEASER_FEATURES = [
  "Choose your token amount",
  "2K image output",
  "Studio, library & brand wizard",
] as const;

export function CustomPackTeaserCard({
  interval,
  scaleTiers,
  onCustomize,
}: CustomPackTeaserCardProps) {
  const minTokens = scaleTiers[0]?.monthlyTokens ?? 300;
  const maxTokens = scaleTiers[scaleTiers.length - 1]?.monthlyTokens ?? 5000;
  const fromPrice = scaleTiers[0]?.monthlyPriceCents ?? 3900;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5">
      <div>
        <p className="mt-1 font-display text-3xl font-normal tracking-tight text-foreground">
          Scale
        </p>
        <p className="mt-1 text-xs text-muted">
          {interval === "annual"
            ? "Billed yearly · tokens expire after 12 months"
            : `From ${formatUsd(fromPrice)}/mo · tokens expire each period`}
        </p>
        <p className="mt-2 text-sm text-muted">
          Built for teams and agencies.
        </p>
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {TEASER_FEATURES.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-sm text-foreground/70"
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
        <li className="flex items-start gap-2 text-sm text-foreground/70">
          <span className="mt-0.5 shrink-0 text-xs">·</span>
          <span>
            {minTokens.toLocaleString()}–
            {maxTokens.toLocaleString()} tokens per pack
          </span>
        </li>
      </ul>

      <TextureButton
        type="button"
        variant="accent"
        shape="card"
        fullWidth
        onClick={onCustomize}
        className="mt-6"
        innerClassName="w-full py-2.5"
      >
        Get Scale
      </TextureButton>
    </div>
  );
}
