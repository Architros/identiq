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
  brandName?: string;
  sector?: string;
  description?: string;
  tagline?: string;
  chatThreadContext?: string;
  isLibraryRemix?: boolean;
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

  const whatTheyDo =
    input.description?.trim() ||
    input.tagline?.trim() ||
    "See brand brief below.";

  return streamText({
    model: llmModel,
    maxOutputTokens: 800,
    system: ORCHESTRATE_SYSTEM_PROMPT,
    abortSignal: input.abortSignal,
    prompt: [
      input.brandName ? `Brand name: ${input.brandName}` : "",
      input.sector ? `Brand sector: ${input.sector}` : "",
      `What they do: ${whatTheyDo}`,
      input.tagline?.trim() && input.description?.trim()
        ? `Tagline: ${input.tagline.trim()}`
        : "",
      input.userPrompt.trim()
        ? `User direction (highest priority): ${input.userPrompt.trim()}`
        : "",
      input.chatThreadContext?.trim() ? input.chatThreadContext.trim() : "",
      input.presets.length > 0
        ? `Preset format: ${input.presets.map((p) => `${p.title} (${p.aspectRatio})`).join(", ")}`
        : "",
      "Brand brief:",
      input.basePrompt,
      referenceNote,
      assetNote,
      input.isLibraryRemix
        ? "This is a library remix — update any stale years or copyright dates to the current year."
        : "",
      "Write the final image generation prompt:",
    ]
      .filter(Boolean)
      .join("\n\n"),
  });
}
