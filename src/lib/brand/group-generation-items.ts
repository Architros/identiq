import {
  ASSET_CATALOG,
  type AssetCatalogCategory,
} from "@/lib/brand/asset-catalog";
import {
  ASSET_CATEGORY_LABELS,
  ASSET_CATEGORY_ORDER,
} from "@/lib/brand/asset-category-labels";
import type { AssetProgressData } from "@/lib/brand/create-stream-types";

export type GenerationAssetSubgroup = {
  catalogId: string;
  title: string;
  items: AssetProgressData[];
};

export type GenerationCategoryGroup = {
  category: AssetCatalogCategory;
  label: string;
  subgroups: GenerationAssetSubgroup[];
};

const catalogOrder = new Map(
  ASSET_CATALOG.map((item, index) => [item.id, index]),
);

export function groupGenerationItems(
  items: AssetProgressData[],
): GenerationCategoryGroup[] {
  const byCategory = new Map<
    AssetCatalogCategory,
    Map<string, AssetProgressData[]>
  >();

  for (const item of items) {
    let subgroupMap = byCategory.get(item.category);
    if (!subgroupMap) {
      subgroupMap = new Map();
      byCategory.set(item.category, subgroupMap);
    }
    const list = subgroupMap.get(item.catalogId) ?? [];
    list.push(item);
    subgroupMap.set(item.catalogId, list);
  }

  return ASSET_CATEGORY_ORDER.map((category) => {
    const subgroupMap = byCategory.get(category);
    if (!subgroupMap?.size) return null;

    const subgroups = [...subgroupMap.entries()]
      .sort(
        ([a], [b]) =>
          (catalogOrder.get(a) ?? 999) - (catalogOrder.get(b) ?? 999),
      )
      .map(([catalogId, subgroupItems]) => ({
        catalogId,
        title: subgroupItems[0]?.title.split(" (")[0] ?? catalogId,
        items: subgroupItems.sort((a, b) => a.index - b.index),
      }));

    return {
      category,
      label: ASSET_CATEGORY_LABELS[category],
      subgroups,
    };
  }).filter((g): g is GenerationCategoryGroup => g !== null);
}
