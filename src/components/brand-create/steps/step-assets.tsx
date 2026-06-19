"use client";

import { useMemo } from "react";
import { useBrandWizard } from "@/contexts/brand-wizard-context";
import {
  ASSET_CATALOG,
  getGeneratableAssetCount,
  resolveJobAspectRatio,
  type AssetCatalogCategory,
} from "@/lib/brand/asset-catalog";
import {
  ORCHESTRATION_TOKEN_COST,
  STARTER_PACK_PER_ASSET_TOKEN_COST,
  calculateStarterPackTokenCost,
} from "@/lib/brand/starter-pack";
import {
  BRAND_CREATION_MAX_GENERATIONS,
  calculateBrandCreationTokenCost,
} from "@/lib/brand/brand-creation-flow";
import { getDraftLogoUrl } from "@/lib/brand/draft-media";
import { useCredits } from "@/contexts/credits-context";
import type { AspectRatio } from "@/lib/generation/presets";
import { cn } from "@/lib/utils";
import { ASSET_CATEGORY_LABELS } from "@/lib/brand/asset-category-labels";

const ASPECT_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "1:1" },
  { value: "4:5", label: "4:5" },
  { value: "9:16", label: "9:16" },
  { value: "16:9", label: "16:9" },
];

export function StepAssets() {
  const { draft, updateDraft } = useBrandWizard();
  const { availableTokens } = useCredits();
  const hasUploadedLogo = Boolean(getDraftLogoUrl(draft));

  const creationCost = useMemo(
    () =>
      calculateBrandCreationTokenCost(draft.assetSelections, {
        hasUploadedLogo,
        aspectOverrides: draft.assetAspectOverrides,
      }),
    [draft.assetSelections, draft.assetAspectOverrides, hasUploadedLogo],
  );

  const totalCost = useMemo(
    () =>
      calculateStarterPackTokenCost(draft.assetSelections, {
        hasUploadedLogo,
      }),
    [draft.assetSelections, hasUploadedLogo],
  );

  const totalAssets = useMemo(
    () => getGeneratableAssetCount(draft.assetSelections, hasUploadedLogo),
    [draft.assetSelections, hasUploadedLogo],
  );

  const setQuantity = (itemId: string, quantity: number) => {
    const item = ASSET_CATALOG.find((a) => a.id === itemId);
    if (!item) return;
    const qty = Math.max(0, Math.min(item.maxQuantity, Math.floor(quantity)));
    updateDraft({
      assetSelections: {
        ...draft.assetSelections,
        [itemId]: qty,
      },
    });
  };

  const setAspectOverride = (itemId: string, aspectRatio: AspectRatio) => {
    updateDraft({
      assetAspectOverrides: {
        ...draft.assetAspectOverrides,
        [itemId]: aspectRatio,
      },
    });
  };

  const byCategory = useMemo(() => {
    const groups: Record<AssetCatalogCategory, typeof ASSET_CATALOG> = {
      logo: [],
      social: [],
      advertising: [],
    };
    for (const item of ASSET_CATALOG) {
      if (hasUploadedLogo && item.id === "brand-logo") continue;
      groups[item.category].push(item);
    }
    return groups;
  }, [hasUploadedLogo]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted">
          Plan your starter pack — choose what you want for this brand. During
          creation we only generate{" "}
          {hasUploadedLogo
            ? "your brand system (no images)"
            : `up to ${BRAND_CREATION_MAX_GENERATIONS} image (your logo if you did not upload one)`}
          . Generate the rest later from Studio or the Library.
        </p>
        {hasUploadedLogo ? (
          <p className="mt-2 text-xs text-muted">
            Your uploaded logo is used as the brand mark — logo generation is not
            included.
          </p>
        ) : null}
        <p className="mt-2 text-xs text-muted">
          {availableTokens} tokens available · {totalAssets} asset
          {totalAssets === 1 ? "" : "s"} in your pack · {creationCost} tokens now
          {totalCost > creationCost
            ? ` · ${totalCost} tokens if you generated everything today`
            : ""}
        </p>
      </div>

      {(Object.keys(byCategory) as AssetCatalogCategory[]).map((category) => {
        const items = byCategory[category];
        if (items.length === 0) return null;
        return (
          <section key={category} className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {ASSET_CATEGORY_LABELS[category]}
            </h3>
            <ul className="space-y-2">
              {items.map((item) => {
                const qty = draft.assetSelections[item.id] ?? 0;
                const lineCost = qty * STARTER_PACK_PER_ASSET_TOKEN_COST;
                const effectiveAspect = resolveJobAspectRatio(
                  item,
                  draft.assetAspectOverrides,
                );
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "rounded-2xl border p-4 transition-colors",
                      qty > 0
                        ? "border-accent/30 bg-accent/[0.04]"
                        : "border-border bg-surface",
                    )}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted">{item.description}</p>
                        <p className="mt-1 text-[11px] text-muted">
                          Default {item.aspectRatio} ·{" "}
                          {STARTER_PACK_PER_ASSET_TOKEN_COST} tokens each
                          {qty > 0 ? ` · ${lineCost} tokens` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {qty > 0 ? (
                          <label className="flex items-center gap-2 text-xs text-muted">
                            <span className="sr-only">
                              Aspect ratio for {item.title}
                            </span>
                            <select
                              value={effectiveAspect}
                              onChange={(e) =>
                                setAspectOverride(
                                  item.id,
                                  e.target.value as AspectRatio,
                                )
                              }
                              className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                            >
                              {ASPECT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : null}
                        <button
                          type="button"
                          aria-label={`Decrease ${item.title}`}
                          disabled={qty <= 0}
                          onClick={() => setQuantity(item.id, qty - 1)}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-lg font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={item.maxQuantity}
                          value={qty}
                          onChange={(e) =>
                            setQuantity(
                              item.id,
                              parseInt(e.target.value, 10) || 0,
                            )
                          }
                          className="h-9 w-14 rounded-lg border border-border bg-background text-center text-sm tabular-nums text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                        />
                        <button
                          type="button"
                          aria-label={`Increase ${item.title}`}
                          disabled={qty >= item.maxQuantity}
                          onClick={() => setQuantity(item.id, qty + 1)}
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-lg font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <div className="rounded-2xl border border-border bg-sidebar-active/40 p-4 text-sm text-muted">
        <p>
          <span className="font-medium text-foreground">At creation: </span>
          {ORCHESTRATION_TOKEN_COST} tokens (brand system)
          {!hasUploadedLogo
            ? ` + ${STARTER_PACK_PER_ASSET_TOKEN_COST} tokens (1 logo)`
            : ""}{" "}
          ={" "}
          <span className="font-medium text-foreground">{creationCost} tokens</span>
        </p>
        {totalCost > creationCost ? (
          <p className="mt-2">
            <span className="font-medium text-foreground">Full pack: </span>
            {totalAssets} × {STARTER_PACK_PER_ASSET_TOKEN_COST} tokens + brand
            system ={" "}
            <span className="font-medium text-foreground">{totalCost} tokens</span>{" "}
            if you generate every selected asset later.
          </p>
        ) : null}
      </div>
    </div>
  );
}
