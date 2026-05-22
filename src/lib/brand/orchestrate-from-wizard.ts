import { generateObject } from "ai";
import { llmModel } from "@/lib/ai/providers";
import {
  brandMemorySchema,
  type WizardOrchestrateInput,
} from "@/lib/brand/brand-memory-schema";
import type { BrandMemory } from "@/lib/brand/types";
import {
  buildBrandIdentitySection,
  brandContextFromWizard,
  buildReferenceGuidanceSection,
  referenceBundleFromWizard,
} from "@/lib/brand/prompt-structure";

function buildOrchestratorInputContext(input: WizardOrchestrateInput): string {
  const brand = brandContextFromWizard(input, {
    brand_style: "—",
    primary_color: input.colors.primary,
    secondary_color: input.colors.secondary,
    font_pairing:
      input.typography?.hasCustomFont && input.typography.fontFamily
        ? input.typography.fontFamily
        : "—",
    visual_language: "—",
    tone: input.feelings?.join(", ") || "—",
  });
  const references = referenceBundleFromWizard(input);

  return [
    buildBrandIdentitySection(brand),
    references
      ? buildReferenceGuidanceSection(references, { forPlanner: true })
      : "",
    input.logoUrl
      ? `Official logo URL (identity must align with this mark): ${input.logoUrl}`
      : "",
    input.colors.accent
      ? `Accent color for visual_language: ${input.colors.accent}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function orchestrateBrandMemoryFromWizard(
  input: WizardOrchestrateInput,
  abortSignal?: AbortSignal,
): Promise<BrandMemory> {
  const { object } = await generateObject({
    model: llmModel,
    schema: brandMemorySchema,
    abortSignal,
    system: `You are a brand strategist for Identiq. Define a cohesive brand memory JSON that will drive all image generation for this company.

The visual_language and brand_style fields must be actionable for an image model: describe palette usage, photography/illustration style, layout tendencies, and mood — not vague marketing copy.

Hard constraints:
- primary_color MUST be exactly ${input.colors.primary}
- secondary_color MUST be exactly ${input.colors.secondary}
${
  input.typography?.hasCustomFont && input.typography.fontFamily
    ? `- font_pairing MUST use the user's custom fonts: "${input.typography.fontFamily}"${input.typography.fontNotes ? ` (${input.typography.fontNotes})` : ""}.`
    : `- font_pairing: suggest a realistic Google-font-friendly pairing as "Display + Body".`
}
- If reference images are provided, visual_language MUST reflect their palette, lighting, and composition — cite specific cues.
- If a logo URL is provided, tone and visual_language must be compatible with that mark (do not describe a conflicting identity).`,
    prompt: buildOrchestratorInputContext(input),
  });

  return {
    ...object,
    primary_color: input.colors.primary,
    secondary_color: input.colors.secondary,
    accent_color: input.colors.accent?.trim() || object.accent_color,
  };
}
