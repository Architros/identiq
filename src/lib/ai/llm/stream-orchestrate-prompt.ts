import { streamText } from "ai";
import { llmModel } from "@/lib/ai/providers";
import type { BrandAsset, BrandMemory } from "@/lib/brand/types";
import type { PresetPromptInput } from "@/lib/generation/build-prompt";
import { ORCHESTRATE_SYSTEM_PROMPT } from "@/lib/ai/llm/orchestrate-system-prompt";

export type StreamOrchestratePromptInput = {
  basePrompt: string;
  brandMemory: BrandMemory;
  brandAssets: BrandAsset[];
  presets: PresetPromptInput[];
  userPrompt: string;
  imageAssist: boolean;
  referenceImageUrls?: string[];
  abortSignal?: AbortSignal;
};

export function streamOrchestratePrompt(input: StreamOrchestratePromptInput) {
  const assetNote =
    input.imageAssist && input.brandAssets.length > 0
      ? `Brand assets to align with: ${input.brandAssets.map((a) => a.label).join(", ")}.`
      : "";

  const referenceNote =
    input.referenceImageUrls && input.referenceImageUrls.length > 0
      ? `${input.referenceImageUrls.length} reference image(s) will be attached at generation. Your final prompt must explicitly require matching their palette, lighting, and composition — this is the highest priority visual constraint.`
      : "";

  return streamText({
    model: llmModel,
    maxOutputTokens: 600,
    system: ORCHESTRATE_SYSTEM_PROMPT,
    abortSignal: input.abortSignal,
    prompt: [
      input.userPrompt.trim()
        ? `User direction (highest priority): ${input.userPrompt.trim()}`
        : "",
      "Brand brief:",
      input.basePrompt,
      referenceNote,
      assetNote,
      "Write the final image generation prompt:",
    ]
      .filter(Boolean)
      .join("\n\n"),
  });
}
