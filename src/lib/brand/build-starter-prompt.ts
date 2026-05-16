import type { BrandMemory } from "@/lib/brand/types";
import type { StarterPackItem } from "@/lib/brand/starter-pack";
import type { WizardOrchestrateInput } from "@/lib/brand/brand-memory-schema";

const VARIANT_ANGLES = [
  "Use a bold, headline-forward layout with strong focal hierarchy.",
  "Use an editorial layout with asymmetric composition and generous negative space.",
  "Use a dynamic, energetic layout with layered shapes and motion cues.",
  "Use a minimal, icon-led layout with restrained copy placement.",
  "Use a photography-led layout with a clear product or lifestyle focal point.",
];

export type StarterPromptVariantOptions = {
  instance: number;
  totalInstances: number;
};

export function buildStarterItemPrompt(
  item: StarterPackItem,
  memory: BrandMemory,
  input: WizardOrchestrateInput,
  variant?: StarterPromptVariantOptions,
): string {
  const parts = [
    `Brand: ${input.name}.`,
    `Style: ${memory.brand_style}.`,
    `Colors: primary ${memory.primary_color}, secondary ${memory.secondary_color}${input.colors.accent ? `, accent ${input.colors.accent}` : ""}.`,
    `Typography feel: ${memory.font_pairing}.`,
    `Visual language: ${memory.visual_language}.`,
    `Tone: ${memory.tone}.`,
    input.description ? `About: ${input.description}` : "",
    `Asset: ${item.title}.`,
    item.prompt,
  ];

  if (variant && variant.totalInstances > 1) {
    const angle =
      VARIANT_ANGLES[variant.instance % VARIANT_ANGLES.length] ??
      VARIANT_ANGLES[0];
    parts.push(
      `Variant ${variant.instance + 1} of ${variant.totalInstances}: must look clearly different from other variants of this asset type. ${angle}`,
    );
  }

  parts.push("On-brand, production-ready, no watermarks.");

  return parts.filter(Boolean).join(" ");
}
