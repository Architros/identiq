import type { BrandAsset, BrandMemory } from "@/lib/brand/types";

export type PresetPromptInput = {
  id: string;
  title: string;
  defaultPrompt: string;
  aspectRatio: string;
};

export type BuildPromptInput = {
  brandMemory: BrandMemory;
  brandAssets: BrandAsset[];
  presets: PresetPromptInput[];
  userPrompt: string;
  imageAssist: boolean;
};

export function buildComposedPrompt(input: BuildPromptInput): string {
  const parts: string[] = [];

  parts.push(
    `Brand style: ${input.brandMemory.brand_style}.`,
    `Primary color: ${input.brandMemory.primary_color}. Secondary: ${input.brandMemory.secondary_color}.`,
    `Typography: ${input.brandMemory.font_pairing}.`,
    `Visual language: ${input.brandMemory.visual_language}.`,
    `Tone: ${input.brandMemory.tone}.`,
  );

  if (input.imageAssist && input.brandAssets.length > 0) {
    const assetRefs = input.brandAssets
      .map((a) => `${a.label} (${a.type}): ${a.url}`)
      .join("; ");
    parts.push(`Use existing brand assets for consistency: ${assetRefs}.`);
  }

  if (input.presets.length > 0) {
    const presetLines = input.presets
      .map((p) => `[${p.title} ${p.aspectRatio}] ${p.defaultPrompt}`)
      .join(" ");
    parts.push(`Asset presets: ${presetLines}`);
  }

  if (input.userPrompt.trim()) {
    parts.push(`User direction: ${input.userPrompt.trim()}`);
  }

  return parts.join("\n\n");
}
