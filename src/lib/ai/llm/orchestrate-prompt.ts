import { generateText } from "ai";
import { llmModel } from "@/lib/ai/providers";
import type { BrandAsset, BrandMemory } from "@/lib/brand/types";
import type { PresetPromptInput } from "@/lib/generation/build-prompt";

export type OrchestratePromptInput = {
  basePrompt: string;
  brandMemory: BrandMemory;
  brandAssets: BrandAsset[];
  presets: PresetPromptInput[];
  userPrompt: string;
  imageAssist: boolean;
};

import { ORCHESTRATE_SYSTEM_PROMPT } from "@/lib/ai/llm/orchestrate-system-prompt";

export async function orchestratePrompt(
  input: OrchestratePromptInput,
): Promise<string> {
  const assetNote =
    input.imageAssist && input.brandAssets.length > 0
      ? `Brand assets to align with: ${input.brandAssets.map((a) => a.label).join(", ")}.`
      : "";

  const { text } = await generateText({
    model: llmModel,
    maxOutputTokens: 600,
    system: ORCHESTRATE_SYSTEM_PROMPT,
    prompt: [
      "Brand brief and request:",
      input.basePrompt,
      assetNote,
      input.userPrompt.trim()
        ? `Additional user direction: ${input.userPrompt.trim()}`
        : "",
      "Write the final image generation prompt:",
    ]
      .filter(Boolean)
      .join("\n\n"),
  });

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("LLM returned an empty prompt");
  }

  return trimmed;
}
