import { ASSET_CATEGORY_LABELS } from "@/lib/brand/asset-category-labels";
import {
  getCatalogItem,
  parseCatalogIdFromJobKey,
  type AssetCatalogCategory,
} from "@/lib/brand/asset-catalog";
import type { GeneratedBrandAsset } from "@/lib/brand/types";

export function assetUsageLabel(asset: GeneratedBrandAsset): string {
  if (asset.presetTitle?.trim()) return asset.presetTitle.trim();
  const catalogId =
    asset.catalogId ?? parseCatalogIdFromJobKey(asset.jobId);
  const item = getCatalogItem(catalogId);
  if (item?.title) return item.title;
  if (asset.category) {
    return ASSET_CATEGORY_LABELS[asset.category as AssetCatalogCategory];
  }
  return "Generated asset";
}

export function assetSourceLabel(
  source: GeneratedBrandAsset["source"] | undefined,
): string {
  if (source === "ideas") return "Ideas";
  if (source === "starter-pack") return "Brand pack";
  return "Generated";
}
