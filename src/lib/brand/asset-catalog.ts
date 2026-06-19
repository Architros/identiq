import { generationPresets } from "@/lib/generation/presets";
import type { AspectRatio, PresetCategory } from "@/lib/generation/presets";

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

const LEGACY_LOGO_IDS = ["primary-logo", "logo-icon"] as const;

const LOGO_ITEMS: AssetCatalogItem[] = [
  {
    id: "brand-logo",
    title: "Brand logo",
    description:
      "Primary logo mark for headers, apps, favicons, and brand lockups.",
    category: "logo",
    kind: "logo",
    aspectRatio: "1:1",
    prompt:
      "Single cohesive brand logo mark. Flat vector-style, clear silhouette, works on light and dark backgrounds. Recognizable at small sizes. No mockup frame, no duplicate variants.",
    maxQuantity: 1,
  },
];

function presetToCatalogCategory(
  category: PresetCategory,
): AssetCatalogCategory {
  return category === "social" ? "social" : "advertising";
}

const PRESET_ITEMS: AssetCatalogItem[] = generationPresets.map((preset) => ({
  id: preset.id,
  title: preset.title,
  description: preset.description,
  category: presetToCatalogCategory(preset.category),
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
  aspectRatio: AspectRatio;
};

export function getDefaultAssetSelections(): Record<string, number> {
  return Object.fromEntries(
    ASSET_CATALOG.map((item) => [
      item.id,
      item.id === "brand-logo" ? 1 : 0,
    ]),
  );
}

function migrateLegacyLogoSelection(
  selections: Record<string, number>,
): number {
  let total = selections["brand-logo"] ?? 0;
  for (const legacyId of LEGACY_LOGO_IDS) {
    total += selections[legacyId] ?? 0;
  }
  return Math.min(1, total);
}

export function normalizeAssetSelections(
  selections?: Record<string, number> | null,
): Record<string, number> {
  const base = getDefaultAssetSelections();
  if (!selections) return base;

  const logoQty = migrateLegacyLogoSelection(selections);
  if (logoQty > 0) {
    base["brand-logo"] = logoQty;
  }

  for (const item of ASSET_CATALOG) {
    if (item.id === "brand-logo") continue;
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

/** Selections with logo generation removed when the user already uploaded a logo. */
export function getEffectiveAssetSelections(
  selections: Record<string, number>,
  options?: { hasUploadedLogo?: boolean },
): Record<string, number> {
  const normalized = normalizeAssetSelections(selections);
  if (!options?.hasUploadedLogo) return normalized;
  return { ...normalized, "brand-logo": 0 };
}

export function getGeneratableAssetCount(
  selections: Record<string, number>,
  hasUploadedLogo?: boolean,
): number {
  return getTotalSelectedAssets(
    getEffectiveAssetSelections(selections, { hasUploadedLogo }),
  );
}

export function resolveJobAspectRatio(
  item: AssetCatalogItem,
  overrides?: Record<string, AspectRatio>,
): AspectRatio {
  return overrides?.[item.id] ?? item.aspectRatio;
}

export function expandAssetSelections(
  selections: Record<string, number>,
  aspectOverrides?: Record<string, AspectRatio>,
): ExpandedAssetJob[] {
  const jobs: ExpandedAssetJob[] = [];
  for (const item of ASSET_CATALOG) {
    const qty = selections[item.id] ?? 0;
    const aspectRatio = resolveJobAspectRatio(item, aspectOverrides);
    for (let instance = 0; instance < qty; instance++) {
      jobs.push({
        jobKey: `${item.id}__${instance}`,
        item: { ...item, aspectRatio },
        instance,
        aspectRatio,
      });
    }
  }
  return jobs;
}

export function getCatalogItem(id: string): AssetCatalogItem | undefined {
  if (id === "brand-logo") return ASSET_CATALOG_BY_ID["brand-logo"];
  const legacy = LEGACY_LOGO_IDS.includes(id as (typeof LEGACY_LOGO_IDS)[number])
    ? "brand-logo"
    : id;
  return ASSET_CATALOG_BY_ID[legacy];
}

export function parseCatalogIdFromJobKey(jobKey: string): string {
  return jobKey.split("__")[0] ?? jobKey;
}
