"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import {
  AssetStorageMeter,
  isStoredAssetsFeatureLine,
} from "@/components/billing/asset-storage-meter";
import { Badge } from "@/components/ui/badge";
import {
  formatPlanPrice,
  type BillingInterval,
  type DisplayPack,
} from "@/lib/billing/plan-catalog";
import { cn } from "@/lib/utils";

type PlanPackCardProps = {
  pack: DisplayPack;
  interval: BillingInterval;
  highlighted?: boolean;
  loading: boolean;
  onBuy: () => void;
};

export function PlanPackCard({
  pack,
  interval,
  highlighted = false,
  loading,
  onBuy,
}: PlanPackCardProps) {
  const headlinePrice = formatPlanPrice(pack.displayPriceCents, interval);

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-surface p-5",
        highlighted
          ? "border-accent/40 shadow-md ring-1 ring-accent/25"
          : "border-border",
      )}
    >
      {pack.badge === "most_popular" ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge>Most popular</Badge>
        </div>
      ) : null}
      {pack.badge === "best_value" ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge>Best value</Badge>
        </div>
      ) : null}

      <div className="mt-1">
        <h3 className="text-sm font-semibold text-foreground">{pack.name}</h3>
        <p className="mt-3 font-display text-3xl font-normal tracking-tight text-foreground">
          {headlinePrice}
        </p>
        <p className="mt-1 text-xs text-muted">{pack.billedLine}</p>
        <p className="mt-2 text-sm text-muted">{pack.tagline}</p>
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {pack.features.map((feature, index) => (
          <li
            key={`${pack.id}-feature-${index}`}
            className="flex items-start gap-2 text-sm text-foreground"
          >
            {isStoredAssetsFeatureLine(feature) ? (
              <AssetStorageMeter
                used={0}
                limit={pack.storedAssetLimit}
                variant="feature"
                className="mt-0.5"
              />
            ) : (
              <>
                <HugeiconsIcon
                  icon={Tick01Icon}
                  size={16}
                  color="currentColor"
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-accent"
                />
                <span>{feature}</span>
              </>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={loading}
        onClick={onBuy}
        className={cn(
          "mt-6 w-full cursor-pointer rounded-xl py-2.5 text-sm font-semibold transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          highlighted
            ? "bg-accent text-white hover:bg-accent/90"
            : "border border-border bg-surface text-foreground hover:bg-sidebar-active",
        )}
      >
        {loading ? "…" : "Buy tokens"}
      </button>
    </div>
  );
}
