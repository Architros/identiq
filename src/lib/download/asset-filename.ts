import type { AssetCatalogCategory } from "@/lib/brand/asset-catalog";
import { assetUsageLabel } from "@/lib/brand/asset-display-labels";
import { resolveAssetCategory } from "@/lib/brand/resolve-asset-category";
import type { GeneratedBrandAsset } from "@/lib/brand/types";

export const CATEGORY_FOLDER: Record<AssetCatalogCategory, string> = {
  logo: "logo",
  social: "social-media",
  advertising: "advertising",
};

export function sanitizeZipSegment(value: string): string {
  const trimmed = value.trim().replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
  return trimmed.replace(/^-+|-+$/g, "").slice(0, 80) || "asset";
}

export function sanitizeZipFilename(value: string): string {
  return sanitizeZipSegment(value).slice(0, 60) || "brand-assets";
}

function extensionFromAsset(asset: GeneratedBrandAsset): string {
  const type = asset.mediaType?.toLowerCase() ?? "";
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
  if (type.includes("gif")) return "gif";
  try {
    const pathname = new URL(asset.previewUrl).pathname;
    const ext = pathname.split(".").pop()?.toLowerCase();
    if (ext && ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
      return ext === "jpeg" ? "jpg" : ext;
    }
  } catch {
    // blob: or relative URLs
  }
  return "png";
}

export type AssetZipEntry = {
  url: string;
  path: string;
};

export function assetsToZipEntries(
  assets: GeneratedBrandAsset[],
  options?: {
    /** Force all files into this folder (e.g. per-category download). */
    categoryFolder?: AssetCatalogCategory;
    /** Files at zip root with no category folders. */
    flat?: boolean;
  },
): AssetZipEntry[] {
  const usedPaths = new Set<string>();
  const entries: AssetZipEntry[] = [];

  for (const asset of assets) {
    if (!asset.previewUrl?.trim()) continue;

    const category = resolveAssetCategory(asset);
    const label = sanitizeZipSegment(assetUsageLabel(asset));
    const shortId = sanitizeZipSegment(asset.jobId).slice(0, 12);
    const ext = extensionFromAsset(asset);
    const baseName = `${label}-${shortId}.${ext}`;

    let folder = "";
    if (!options?.flat) {
      const catKey = options?.categoryFolder ?? category;
      folder = `${CATEGORY_FOLDER[catKey]}/`;
    }

    let path = `${folder}${baseName}`;
    let n = 2;
    while (usedPaths.has(path)) {
      path = `${folder}${label}-${shortId}-${n}.${ext}`;
      n += 1;
    }
    usedPaths.add(path);

    entries.push({ url: asset.previewUrl, path });
  }

  return entries;
}

export function zipFilenameForBrand(
  brandName: string,
  suffix?: string,
): string {
  const base = sanitizeZipFilename(brandName);
  return suffix ? `${base}-${suffix}.zip` : `${base}-assets.zip`;
}
