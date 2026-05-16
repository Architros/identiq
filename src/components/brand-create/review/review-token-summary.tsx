"use client";

import { useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Coins01Icon } from "@hugeicons/core-free-icons";
import {
  ORCHESTRATION_TOKEN_COST,
  STARTER_PACK_PER_ASSET_TOKEN_COST,
  calculateStarterPackTokenCost,
} from "@/lib/brand/starter-pack";
import { ASSET_CATALOG } from "@/lib/brand/asset-catalog";
import { useCredits } from "@/contexts/credits-context";
import { cn } from "@/lib/utils";

type ReviewTokenSummaryProps = {
  assetSelections: Record<string, number>;
  showError?: boolean;
};

function TokenAmount({ value }: { value: number }) {
  return (
    <span className="inline-flex min-w-[3rem] items-center justify-end gap-1 tabular-nums">
      <span className="font-medium text-foreground">{value}</span>
      <span className="text-xs font-normal text-muted">tokens</span>
    </span>
  );
}

export function ReviewTokenSummary({
  assetSelections,
  showError,
}: ReviewTokenSummaryProps) {
  const { availableTokens, openBuyTokens } = useCredits();

  const totalCost = useMemo(
    () => calculateStarterPackTokenCost(assetSelections),
    [assetSelections],
  );

  const selectedAssets = useMemo(() => {
    return ASSET_CATALOG.flatMap((item) => {
      const qty = assetSelections[item.id] ?? 0;
      if (qty <= 0) return [];
      return [{ item, qty }];
    });
  }, [assetSelections]);

  const canAfford = availableTokens >= totalCost;
  const remaining = availableTokens - totalCost;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-sidebar-active/40 px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">
          Tokens to be consumed
        </h3>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-semibold tabular-nums text-accent">
          <HugeiconsIcon
            icon={Coins01Icon}
            size={14}
            color="currentColor"
            strokeWidth={1.75}
          />
          {totalCost}
        </span>
      </div>

      <ul className="divide-y divide-border px-5">
        <li className="flex items-center justify-between gap-4 py-3">
          <span className="text-sm text-foreground">Brand System</span>
          <TokenAmount value={ORCHESTRATION_TOKEN_COST} />
        </li>
        {selectedAssets.map(({ item, qty }) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-4 py-3"
          >
            <span className="min-w-0 text-sm text-foreground">
              {item.title}
              <span className="ml-1.5 text-muted">× {qty}</span>
            </span>
            <TokenAmount value={qty * STARTER_PACK_PER_ASSET_TOKEN_COST} />
          </li>
        ))}
      </ul>

      <div
        className={cn(
          "flex flex-col gap-2 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
          canAfford ? "bg-background" : "bg-red-50/80",
        )}
      >
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium tabular-nums text-foreground">
            <HugeiconsIcon
              icon={Coins01Icon}
              size={12}
              color="currentColor"
              strokeWidth={1.75}
            />
            {availableTokens} available
          </span>
          {canAfford ? (
            <span className="text-xs text-muted">
              {remaining} left after generation
            </span>
          ) : (
            <span className="text-xs font-medium text-red-600">
              Need {totalCost - availableTokens} more
            </span>
          )}
        </div>

        {showError && !canAfford ? (
          <button
            type="button"
            onClick={openBuyTokens}
            className="cursor-pointer text-left text-xs font-medium text-accent hover:underline sm:text-right"
          >
            Buy more tokens
          </button>
        ) : null}
      </div>
    </section>
  );
}
