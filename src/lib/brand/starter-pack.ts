import {
  ASSET_CATALOG,
  expandAssetSelections,
  getGeneratableAssetCount,
  getTotalSelectedAssets,
  type AssetCatalogItem,
} from "@/lib/brand/asset-catalog";
import type { AspectRatio } from "@/lib/generation/presets";

export type StarterPackItemKind = "logo" | "preset";

export type StarterPackItem = {
  id: string;
  title: string;
  kind: StarterPackItemKind;
  presetId?: string;
  aspectRatio: AspectRatio;
  prompt: string;
};

/** @deprecated Use ASSET_CATALOG — kept for imports that expect the original six items */
export const STARTER_PACK_ITEMS: StarterPackItem[] = ASSET_CATALOG.filter(
  (item) =>
    [
      "brand-logo",
      "instagram-post",
      "instagram-story",
      "linkedin-post",
      "x-post",
    ].includes(item.id),
).map(catalogItemToStarterItem);

export const ORCHESTRATION_TOKEN_COST = 2;

export const STARTER_PACK_PER_ASSET_TOKEN_COST = 3;

export function catalogItemToStarterItem(
  item: AssetCatalogItem,
): StarterPackItem {
  return {
    id: item.id,
    title: item.title,
    kind: item.kind,
    presetId: item.presetId,
    aspectRatio: item.aspectRatio,
    prompt: item.prompt,
  };
}

export function calculateStarterPackTokenCost(
  selections?: Record<string, number>,
  options?: { hasUploadedLogo?: boolean },
): number {
  const assetCount = getGeneratableAssetCount(
    selections ?? {},
    options?.hasUploadedLogo,
  );
  return (
    ORCHESTRATION_TOKEN_COST +
    assetCount * STARTER_PACK_PER_ASSET_TOKEN_COST
  );
}

export function calculateStarterPackTokenCostLegacy(): number {
  return calculateStarterPackTokenCost(
    Object.fromEntries(STARTER_PACK_ITEMS.map((item) => [item.id, 1])),
  );
}

export {
  expandAssetSelections,
  getGeneratableAssetCount,
  getTotalSelectedAssets,
};
