"use client";

import { useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon } from "@hugeicons/core-free-icons";
import {
  ASSET_CATALOG,
  type AssetCatalogCategory,
} from "@/lib/brand/asset-catalog";
import { generationPresets } from "@/lib/generation/presets";
import { STARTER_PACK_PER_ASSET_TOKEN_COST } from "@/lib/brand/starter-pack";

import { ASSET_CATEGORY_LABELS } from "@/lib/brand/asset-category-labels";

type ReviewBrandAssetsProps = {
  assetSelections: Record<string, number>;
};

export function ReviewBrandAssets({ assetSelections }: ReviewBrandAssetsProps) {
  const grouped = useMemo(() => {
    const groups: Record<
      AssetCatalogCategory,
      { item: (typeof ASSET_CATALOG)[number]; qty: number }[]
    > = {
      logo: [],
      social: [],
      advertising: [],
    };

    for (const item of ASSET_CATALOG) {
      const qty = assetSelections[item.id] ?? 0;
      if (qty <= 0) continue;
      groups[item.category].push({ item, qty });
    }
    return groups;
  }, [assetSelections]);

  const presetIcons = useMemo(
    () => Object.fromEntries(generationPresets.map((p) => [p.id, p.platformIcon])),
    [],
  );

  const hasAny = Object.values(grouped).some((g) => g.length > 0);
  if (!hasAny) {
    return <p className="text-sm text-red-600">No assets selected</p>;
  }

  return (
    <div className="space-y-5">
      {(Object.keys(grouped) as AssetCatalogCategory[]).map((category) => {
        const items = grouped[category];
        if (items.length === 0) return null;
        return (
          <section key={category} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
              {ASSET_CATEGORY_LABELS[category]}
            </h4>
            <ul className="space-y-2">
              {items.map(({ item, qty }) => {
                const Icon =
                  item.kind === "logo"
                    ? Image01Icon
                    : (item.presetId && presetIcons[item.presetId]) ||
                      Image01Icon;
                const lineCost = qty * STARTER_PACK_PER_ASSET_TOKEN_COST;
                return (
                  <li
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-border bg-background p-3"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sidebar-active text-muted">
                      <HugeiconsIcon
                        icon={Icon}
                        size={22}
                        color="currentColor"
                        strokeWidth={1.5}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-accent">
                        ×{qty}
                      </span>
                      <span className="text-[10px] tabular-nums text-muted">
                        {lineCost} tokens
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
