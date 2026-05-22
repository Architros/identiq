import type { AssetCatalogCategory } from "@/lib/brand/asset-catalog";
import type {
  AssetCompleteData,
  AssetProgressData,
} from "@/lib/brand/create-stream-types";
import type { GenerationCategoryGroup } from "@/lib/brand/group-generation-items";
import {
  type AssetZipEntry,
  sanitizeZipSegment,
} from "@/lib/download/asset-filename";
import { generatedImagePreviewUrl } from "@/lib/storage/upload-client";

const CATEGORY_FOLDER: Record<AssetCatalogCategory, string> = {
  logo: "logo",
  social: "social-media",
  advertising: "advertising",
};

function extensionFromMediaType(mediaType: string): string {
  const type = mediaType.toLowerCase();
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  return "png";
}

export function starterPackGroupToZipEntries(
  group: GenerationCategoryGroup,
  results: Map<string, AssetCompleteData>,
): AssetZipEntry[] {
  const usedPaths = new Set<string>();
  const entries: AssetZipEntry[] = [];
  const folder = `${CATEGORY_FOLDER[group.category]}/`;

  for (const subgroup of group.subgroups) {
    const subgroupSlug = sanitizeZipSegment(subgroup.title);
    for (const item of subgroup.items) {
      if (item.status !== "saved") continue;
      const result = results.get(item.itemId);
      const url = result ? generatedImagePreviewUrl(result) : undefined;
      if (!url) continue;

      const title = sanitizeZipSegment(
        item.variantLabel
          ? `${item.title}-${item.variantLabel}`
          : item.title,
      );
      const ext = extensionFromMediaType(result?.mediaType ?? "image/png");
      let path = `${folder}${subgroupSlug}/${title}-${item.index + 1}.${ext}`;
      let n = 2;
      while (usedPaths.has(path)) {
        path = `${folder}${subgroupSlug}/${title}-${item.index + 1}-${n}.${ext}`;
        n += 1;
      }
      usedPaths.add(path);
      entries.push({ url, path });
    }
  }

  return entries;
}

export function starterPackAllZipEntries(
  groups: GenerationCategoryGroup[],
  results: Map<string, AssetCompleteData>,
): AssetZipEntry[] {
  return groups.flatMap((group) =>
    starterPackGroupToZipEntries(group, results),
  );
}
