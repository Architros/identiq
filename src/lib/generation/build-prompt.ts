import type { BrandAsset, BrandMemory } from "@/lib/brand/types";
import {
  assembleIdeasGenerationPrompt,
  assembleLibraryRemixPrompt,
  type BrandPromptContext,
} from "@/lib/brand/prompt-structure";

export type PresetPromptInput = {
  id: string;
  title: string;
  defaultPrompt: string;
  aspectRatio: string;
};

export type BuildPromptInput = {
  brandMemory: BrandMemory;
  brandDisplayName: string;
  brandAssets: BrandAsset[];
  presets: PresetPromptInput[];
  userPrompt: string;
  imageAssist: boolean;
  referenceImageUrls?: string[];
  referenceImageNames?: string[];
  mode?: "default" | "library-remix";
  hasLogoAttachment?: boolean;
  sector?: string;
  description?: string;
  feelings?: string[];
};

export function buildComposedPrompt(input: BuildPromptInput): string {
  const brand: BrandPromptContext = {
    brandName: input.brandDisplayName,
    memory: input.brandMemory,
    description: input.description,
    sector: input.sector,
    feelings: input.feelings,
  };

  const presetLines =
    input.presets.length > 0
      ? input.presets.map(
          (p) => `[${p.title} ${p.aspectRatio}] ${p.defaultPrompt}`,
        )
      : undefined;

  const brandAssetRefs =
    input.imageAssist && input.brandAssets.length > 0
      ? input.brandAssets.map((a) => ({
          label: a.label,
          type: a.type,
          url: a.url,
        }))
      : undefined;

  if (input.mode === "library-remix") {
    const urls = input.referenceImageUrls ?? [];
    const names =
      input.referenceImageNames ??
      urls.map((_, i) => `Reference ${i + 1}`);
    return assembleLibraryRemixPrompt({
      brand,
      userDirection: input.userPrompt,
      referenceUrls: urls,
      referenceNames: names,
      hasLogoAttachment: input.hasLogoAttachment ?? false,
    });
  }

  return assembleIdeasGenerationPrompt({
    brand,
    userDirection: input.userPrompt,
    presetLines,
    brandAssetRefs,
    referenceImageUrls: input.referenceImageUrls,
  });
}
