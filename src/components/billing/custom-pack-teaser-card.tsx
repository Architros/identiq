"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import type { BillingInterval } from "@/lib/billing/plan-catalog";
import {
  CUSTOM_TOKEN_MAX,
  CUSTOM_TOKEN_MIN,
} from "@/lib/billing/custom-pack-pricing";
import { cn } from "@/lib/utils";

type CustomPackTeaserCardProps = {
  interval: BillingInterval;
  onCustomize: () => void;
};

const TEASER_FEATURES = [
  "Choose your token amount",
  "2K image output",
  "Studio, library & brand wizard",
] as const;

export function CustomPackTeaserCard({
  interval,
  onCustomize,
}: CustomPackTeaserCardProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5">
      <div>
        <p className="mt-1 font-display text-3xl font-normal tracking-tight text-foreground">
          Scale
        </p>
        <p className="mt-1 text-xs text-muted">
          {interval === "annual"
            ? "Annual lump · 2 months free"
            : "From $39 · volume pricing"}
        </p>
        <p className="mt-2 text-sm text-muted">
          Built for teams and agencies.
        </p>
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {TEASER_FEATURES.map((feature) => (
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
        <li className="flex items-start gap-2 text-sm text-muted">
          <span className="mt-0.5 shrink-0 text-xs">·</span>
          <span>
            {CUSTOM_TOKEN_MIN.toLocaleString()}–
            {CUSTOM_TOKEN_MAX.toLocaleString()} tokens per pack
          </span>
        </li>
      </ul>

      <button
        type="button"
        onClick={onCustomize}
        className={cn(
          "mt-6 w-full cursor-pointer rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-sidebar-active",
        )}
      >
        Customize pack
      </button>
    </div>
  );
}
