import type { BrandKit } from "@/lib/brand/types";
import type { BrandPromptContext } from "@/lib/brand/prompt-structure";
import type { GenerationRequestBody } from "@/lib/generation/generate-request-schema";

export function resolveServerBrandContext(
  kit: BrandKit | null,
  gen: GenerationRequestBody,
): {
  brandMemory: GenerationRequestBody["brandMemory"];
  brandAssets: GenerationRequestBody["brandAssets"];
  brandDisplayName: string;
  brandPromptContext: BrandPromptContext;
} {
  const brandMemory = kit?.memory ?? gen.brandMemory;
  const brandAssets = kit?.assets ?? gen.brandAssets;
  const brandDisplayName =
    kit?.displayName ?? gen.brandDisplayName ?? "Brand";

  return {
    brandMemory,
    brandAssets,
    brandDisplayName,
    brandPromptContext: {
      brandName: brandDisplayName,
      memory: brandMemory,
      description: kit?.description,
      sector: kit?.sector,
      feelings: kit?.feelings,
      tagline: kit?.tagline,
      domain: kit?.domain,
    },
  };
}

export function mergePriorImageReference(
  urls: string[],
  names: string[],
  priorImageUrl: string,
): { urls: string[]; names: string[] } {
  if (urls.includes(priorImageUrl)) {
    return { urls, names };
  }
  const mergedUrls = [...urls, priorImageUrl].slice(0, 4);
  const mergedNames = [...names, "Previous generation"].slice(0, 4);
  return { urls: mergedUrls, names: mergedNames };
}

export function isPromptTooVague(
  prompt: string,
  brandName: string,
  sector?: string,
): boolean {
  const trimmed = prompt.trim();
  if (trimmed.length < 40) return true;

  const lower = trimmed.toLowerCase();
  const brandLower = brandName.trim().toLowerCase();
  if (brandLower && lower.includes(brandLower)) return false;

  if (sector?.trim()) {
    const sectorLower = sector.trim().toLowerCase();
    if (sectorLower.length >= 3 && lower.includes(sectorLower)) return false;
  }

  return trimmed.length < 120;
}

export function imageGenerationTimeoutMs(resolution: string): number {
  return resolution === "2K" ? 150_000 : 90_000;
}
