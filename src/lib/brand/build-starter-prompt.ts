import type { BrandMemory } from "@/lib/brand/types";
import type { StarterPackItem } from "@/lib/brand/starter-pack";
import type { WizardOrchestrateInput } from "@/lib/brand/brand-memory-schema";
import {
  brandContextFromWizard,
  referenceBundleFromWizard,
} from "@/lib/brand/prompt-structure";

const VARIANT_ANGLES = [
  "Bold, headline-forward layout with strong focal hierarchy.",
  "Editorial layout with asymmetric composition and generous negative space.",
  "Dynamic, energetic layout with layered shapes and motion cues.",
  "Minimal, icon-led layout with restrained copy placement.",
  "Photography-led layout with a clear product or lifestyle focal point.",
];

export type StarterPromptVariantOptions = {
  instance: number;
  totalInstances: number;
};

/** Fallback per-asset brief when the planner LLM is unavailable. */
export function buildStarterItemPrompt(
  item: StarterPackItem,
  memory: BrandMemory,
  input: WizardOrchestrateInput,
  variant?: StarterPromptVariantOptions,
): string {
  const brand = brandContextFromWizard(input, memory);
  const refs = referenceBundleFromWizard(input);

  const briefParts = [
    `Create ${item.title} for ${brand.brandName}.`,
    item.prompt,
    refs
      ? "Align palette, mood, and visual style with the brand reference images provided at generation time."
      : "",
    variant && variant.totalInstances > 1
      ? `Variant ${variant.instance + 1} of ${variant.totalInstances}: must look clearly different from other variants. ${
          VARIANT_ANGLES[variant.instance % VARIANT_ANGLES.length] ??
          VARIANT_ANGLES[0]
        }`
      : "",
  ];

  return briefParts.filter(Boolean).join(" ");
}
