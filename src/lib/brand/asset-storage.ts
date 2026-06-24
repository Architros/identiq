import type { GeneratedBrandAsset } from "@/lib/brand/types";
import type { Resolution } from "@/lib/generation/presets";

export type StoredAssets = Record<string, GeneratedBrandAsset[]>;

const STORAGE_KEY = "identiq_generated_assets";

function isPersistablePreviewUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return !trimmed.startsWith("data:") && !trimmed.startsWith("blob:");
}

/** Strip non-persistable preview URLs so localStorage stays small. */
export function slimAssetForStorage(
  asset: GeneratedBrandAsset,
): GeneratedBrandAsset {
  const previewUrl = isPersistablePreviewUrl(asset.previewUrl)
    ? asset.previewUrl
    : "";
  const composedPrompt =
    asset.composedPrompt.length > 400
      ? `${asset.composedPrompt.slice(0, 400)}…`
      : asset.composedPrompt;
  return { ...asset, previewUrl, composedPrompt };
}

export function slimAssetsRecord(data: StoredAssets): StoredAssets {
  const out: StoredAssets = {};
  for (const [brandId, assets] of Object.entries(data)) {
    out[brandId] = assets.map(slimAssetForStorage);
  }
  return out;
}

export function safeSaveAssetsToStorage(data: StoredAssets): boolean {
  if (typeof window === "undefined") return false;
  const slim = slimAssetsRecord(data);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    return true;
  } catch (error) {
    const quotaExceeded =
      error instanceof DOMException && error.name === "QuotaExceededError";
    if (!quotaExceeded) return false;
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
      return true;
    } catch {
      return false;
    }
  }
}

export function loadAssetsFromStorage(): StoredAssets {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredAssets;
  } catch {
    return {};
  }
}

export type IdeasAssetBilling = {
  tokenCost: number;
  generationId: string;
  presetCount: number;
  hasPrompt: boolean;
  isLibraryRemix: boolean;
  quantity: number;
  resolution: Resolution;
  referenceImageCount: number;
};
