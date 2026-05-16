import { generationPresets } from "@/lib/generation/presets";
import type { AspectRatio } from "@/lib/generation/presets";

export type AssetCatalogCategory = "logo" | "social" | "advertising";

export type AssetCatalogItem = {
  id: string;
  title: string;
  description: string;
  category: AssetCatalogCategory;
  kind: "logo" | "preset";
  presetId?: string;
  aspectRatio: AspectRatio;
  prompt: string;
  maxQuantity: number;
};

const LOGO_ITEMS: AssetCatalogItem[] = [
  {
    id: "primary-logo",
    title: "Primary logo",
    description: "Main logo mark for headers, apps, and brand lockups.",
    category: "logo",
    kind: "logo",
    aspectRatio: "1:1",
    prompt:
      "Minimal primary logo mark for the brand. Flat vector-style, clear silhouette, works on light and dark backgrounds. No mockup frame.",
    maxQuantity: 5,
  },
  {
    id: "logo-icon",
    title: "Logo icon",
    description: "Compact icon for favicons, avatars, and small placements.",
    category: "logo",
    kind: "logo",
    aspectRatio: "1:1",
    prompt:
      "Compact icon mark derived from the primary logo. Simple, recognizable at small sizes. Centered on subtle brand-colored background.",
    maxQuantity: 5,
  },
];

const PRESET_ITEMS: AssetCatalogItem[] = generationPresets.map((preset) => ({
  id: preset.id,
  title: preset.title,
  description: preset.description,
  category: preset.category === "social" ? "social" : "advertising",
  kind: "preset" as const,
  presetId: preset.id,
  aspectRatio: preset.aspectRatio,
  prompt: preset.defaultPrompt,
  maxQuantity: 20,
}));

export const ASSET_CATALOG: AssetCatalogItem[] = [...LOGO_ITEMS, ...PRESET_ITEMS];

export const ASSET_CATALOG_BY_ID = Object.fromEntries(
  ASSET_CATALOG.map((item) => [item.id, item]),
) as Record<string, AssetCatalogItem>;

export type ExpandedAssetJob = {
  jobKey: string;
  item: AssetCatalogItem;
  instance: number;
};

export function getDefaultAssetSelections(): Record<string, number> {
  return Object.fromEntries(
    ASSET_CATALOG.map((item) => [item.id, item.kind === "logo" ? 1 : 0]),
  );
}

export function normalizeAssetSelections(
  selections?: Record<string, number> | null,
): Record<string, number> {
  const base = getDefaultAssetSelections();
  if (!selections) return base;
  for (const item of ASSET_CATALOG) {
    const raw = selections[item.id];
    if (typeof raw === "number" && raw >= 0) {
      base[item.id] = Math.min(Math.floor(raw), item.maxQuantity);
    }
  }
  return base;
}

export function getTotalSelectedAssets(
  selections: Record<string, number>,
): number {
  return Object.values(selections).reduce(
    (sum, qty) => sum + (qty > 0 ? qty : 0),
    0,
  );
}

export function expandAssetSelections(
  selections: Record<string, number>,
): ExpandedAssetJob[] {
  const jobs: ExpandedAssetJob[] = [];
  for (const item of ASSET_CATALOG) {
    const qty = selections[item.id] ?? 0;
    for (let instance = 0; instance < qty; instance++) {
      jobs.push({
        jobKey: `${item.id}__${instance}`,
        item,
        instance,
      });
    }
  }
  return jobs;
}

export function getCatalogItem(id: string): AssetCatalogItem | undefined {
  return ASSET_CATALOG_BY_ID[id];
}
