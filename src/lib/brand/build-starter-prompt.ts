import type { BrandMemory } from "@/lib/brand/types";
import type { StarterPackItem } from "@/lib/brand/starter-pack";
import type { WizardOrchestrateInput } from "@/lib/brand/brand-memory-schema";

export function buildStarterItemPrompt(
  item: StarterPackItem,
  memory: BrandMemory,
  input: WizardOrchestrateInput,
): string {
  return [
    `Brand: ${input.name}.`,
    `Style: ${memory.brand_style}.`,
    `Colors: primary ${memory.primary_color}, secondary ${memory.secondary_color}${input.colors.accent ? `, accent ${input.colors.accent}` : ""}.`,
    `Typography feel: ${memory.font_pairing}.`,
    `Visual language: ${memory.visual_language}.`,
    `Tone: ${memory.tone}.`,
    input.description ? `About: ${input.description}` : "",
    `Asset: ${item.title}.`,
    item.prompt,
    "On-brand, production-ready, no watermarks.",
  ]
    .filter(Boolean)
    .join(" ");
}
