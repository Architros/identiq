import type { AssetCatalogCategory } from "@/lib/brand/asset-catalog";

/** Labels aligned with the Assets wizard step and review. */
export const ASSET_CATEGORY_LABELS: Record<AssetCatalogCategory, string> = {
  logo: "Logo marks",
  social: "Social media",
  advertising: "Advertising",
};

export const ASSET_CATEGORY_ORDER: AssetCatalogCategory[] = [
  "logo",
  "social",
  "advertising",
];
