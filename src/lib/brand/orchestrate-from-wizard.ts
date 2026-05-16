import { generateObject } from "ai";
import { llmModel } from "@/lib/ai/providers";
import {
  brandMemorySchema,
  type WizardOrchestrateInput,
} from "@/lib/brand/brand-memory-schema";
import type { BrandMemory } from "@/lib/brand/types";

export async function orchestrateBrandMemoryFromWizard(
  input: WizardOrchestrateInput,
  abortSignal?: AbortSignal,
): Promise<BrandMemory> {
  const { object } = await generateObject({
    model: llmModel,
    schema: brandMemorySchema,
    abortSignal,
    system: `You are a brand strategist for identiq. Output a cohesive brand memory JSON.
Hard constraints:
- primary_color MUST be exactly ${input.colors.primary}
- secondary_color MUST be exactly ${input.colors.secondary}
- Reflect sector, feelings, audience, and description faithfully.
${
  input.typography?.hasCustomFont && input.typography.fontFamily
    ? `- font_pairing MUST use the user's custom fonts: "${input.typography.fontFamily}"${input.typography.fontNotes ? ` (${input.typography.fontNotes})` : ""}.`
    : `- font_pairing: suggest a realistic Google-font-friendly pairing as "Display + Body".`
}
- Keep tone and visual_language aligned with selected feelings.`,
    prompt: [
      `Brand name: ${input.name}`,
      input.domain ? `Domain: ${input.domain}` : "",
      input.tagline ? `Tagline: ${input.tagline}` : "",
      `Sector: ${input.sector}`,
      `Feelings: ${input.feelings.join(", ") || "balanced"}`,
      `Description: ${input.description}`,
      input.audience ? `Target audience: ${input.audience}` : "",
      input.styleNotes ? `Style notes: ${input.styleNotes}` : "",
      input.attachmentNames?.length
        ? `Reference files: ${input.attachmentNames.join(", ")}`
        : "",
      input.attachmentUrls?.length
        ? `Reference image URLs (brand inspiration): ${input.attachmentUrls.join(", ")}`
        : "",
      input.colors.accent
        ? `Accent color (use in visual_language guidance): ${input.colors.accent}`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return object;
}
