import {
  getCatalogItem,
  parseCatalogIdFromJobKey,
  type AssetCatalogCategory,
} from "@/lib/brand/asset-catalog";
import type { GeneratedBrandAsset } from "@/lib/brand/types";

export function resolveAssetCategory(
  asset: GeneratedBrandAsset,
): AssetCatalogCategory {
  if (asset.category) return asset.category;
  const catalogId = asset.catalogId ?? parseCatalogIdFromJobKey(asset.jobId);
  const item = getCatalogItem(catalogId);
  if (item) return item.category;
  return "social";
}
