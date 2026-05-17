import type { BrandMemory, BrandReference } from "@/lib/brand/types";
import type { WizardOrchestrateInput } from "@/lib/brand/brand-memory-schema";

/** Shared brand context for planners and image models. */
export type BrandPromptContext = {
  brandName: string;
  memory: BrandMemory;
  description?: string;
  sector?: string;
  feelings?: string[];
  audience?: string;
  styleNotes?: string;
  accentColor?: string;
  tagline?: string;
  domain?: string;
};

export type ReferencePromptBundle = {
  names: string[];
  urls: string[];
};

export type ImagePromptAssemblyInput = {
  brand: BrandPromptContext;
  /** Asset-specific creative direction (from planner or catalog). */
  creativeBrief: string;
  assetTitle: string;
  catalogId?: string;
  category?: string;
  aspectRatio?: string;
  variantLabel?: string;
  references?: ReferencePromptBundle;
  logoUrl?: string;
  /** True when generating the primary logo asset from scratch. */
  isLogoAsset?: boolean;
  /** User uploaded their own logo — reproduction / mark-only tasks. */
  useUploadedLogoAsSource?: boolean;
};

export function brandContextFromWizard(
  input: WizardOrchestrateInput,
  memory: BrandMemory,
): BrandPromptContext {
  return {
    brandName: input.name,
    memory,
    description: input.description,
    sector: input.sector,
    feelings: input.feelings,
    audience: input.audience,
    styleNotes: input.styleNotes,
    accentColor: input.colors.accent,
    tagline: input.tagline,
    domain: input.domain,
  };
}

/** Image URLs for multimodal generation (references + optional logo). */
export function collectBrandReferenceImageUrls(input: {
  references: BrandReference[];
  logoUrl?: string;
}): string[] {
  const urls = input.references
    .filter((r) => r.url && r.type.toLowerCase().startsWith("image/"))
    .map((r) => r.url);

  if (input.logoUrl && !urls.includes(input.logoUrl)) {
    urls.push(input.logoUrl);
  }

  return urls;
}

export function referenceBundleFromWizard(
  input: WizardOrchestrateInput,
): ReferencePromptBundle | undefined {
  const urls = input.attachmentUrls ?? [];
  if (urls.length === 0) return undefined;
  return {
    urls,
    names: input.attachmentNames ?? urls.map((_, i) => `Reference ${i + 1}`),
  };
}

/** System instructions for the starter-pack prompt planner LLM. */
export function buildStarterPackPlannerSystemPrompt(): string {
  return `You are a senior brand art director planning image-generation prompts for a cohesive starter pack.

Your prompts will be assembled into a final structure:
1) Brand identity (fixed — already known to the image model)
2) Your per-asset creative brief (what you write)
3) Reference images and logo (injected at generation time)

Rules for each job prompt you write:
- Write ONLY the asset-specific creative brief (layout, subject, copy placeholders, mood, composition). Do NOT repeat full brand guidelines — those are added automatically.
- Customize every brief to this exact brand: sector, feelings, description, and reference mood — never generic stock art.
- When reference images are listed, state how this asset should echo their palette, lighting, and visual language.
- For multiple instances of the same asset type: each brief MUST use a distinct creative angle (layout, headline theme, metaphor, composition). Never repeat concepts.
- brand-logo: one standalone logo mark on a clean field — no device mockups, no duplicate lockups.
- Non-logo assets: compositions that can incorporate the brand logo when provided later.
- Respect aspect ratio and platform intent (social, print, etc.).
- Under 100 words per prompt, production-ready, no watermarks.
- variantLabel: short UI label (e.g. "Bold headline", "Editorial layout").`;
}

/** User message context for the starter-pack planner. */
export function buildStarterPackPlannerUserContext(
  brand: BrandPromptContext,
  jobsDescription: string,
  references?: ReferencePromptBundle,
): string {
  const { memory } = brand;
  return [
    "## Brand identity (apply to every asset brief)",
    buildBrandIdentitySection(brand),
    "",
    references?.urls.length
      ? [
          "## Reference images (align every brief to these)",
          buildReferenceGuidanceSection(references, {
            forPlanner: true,
          }),
        ].join("\n")
      : "",
    brand.memory.visual_language
      ? `Visual language detail: ${memory.visual_language}`
      : "",
    "",
    "## Jobs to plan (one prompt per jobKey)",
    jobsDescription,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildBrandIdentitySection(brand: BrandPromptContext): string {
  const { memory } = brand;
  const lines = [
    `Brand name: ${brand.brandName}`,
    brand.domain ? `Domain: ${brand.domain}` : "",
    brand.tagline ? `Tagline: ${brand.tagline}` : "",
    brand.sector ? `Sector / industry: ${brand.sector}` : "",
    brand.feelings?.length
      ? `Brand personality: ${brand.feelings.join(", ")}`
      : "",
    brand.description ? `What they do: ${brand.description}` : "",
    brand.audience ? `Target audience: ${brand.audience}` : "",
    brand.styleNotes ? `Style notes from founder: ${brand.styleNotes}` : "",
    "",
    `Brand style: ${memory.brand_style}`,
    `Color system — primary: ${memory.primary_color}, secondary: ${memory.secondary_color}${brand.accentColor ? `, accent: ${brand.accentColor}` : ""}. Use these colors deliberately in every composition.`,
    `Typography direction: ${memory.font_pairing}`,
    `Visual language: ${memory.visual_language}`,
    `Tone of voice (visual): ${memory.tone}`,
    "",
    "Every pixel should feel unmistakably on-brand for this company — not a generic template.",
  ];
  return lines.filter(Boolean).join("\n");
}

export function buildReferenceGuidanceSection(
  refs: ReferencePromptBundle,
  options?: { forPlanner?: boolean },
): string {
  const lines = refs.urls.map((url, i) => {
    const name = refs.names[i] ?? `Reference ${i + 1}`;
    return `- ${name}: ${url}`;
  });

  if (options?.forPlanner) {
    return [
      "The user supplied these reference images. Each asset brief should say how it reflects their palette, lighting, texture, and mood.",
      ...lines,
    ].join("\n");
  }

  return [
    "## Reference images (HIGH PRIORITY)",
    "Attached reference image(s) are the primary visual guide. Before rendering:",
    "- Match their color palette, contrast, and material feel in this output.",
    "- Match lighting quality, atmosphere, and composition style unless the asset brief requires a deliberate change.",
    "- Carry forward distinctive brand cues (patterns, shapes, photography style) — do not produce a generic unrelated scene.",
    "Reference list:",
    ...lines,
    "The final image must clearly belong to the same brand world as these references.",
  ].join("\n");
}

export function buildLogoGuidanceSection(logoUrl: string): string {
  return [
    "## Brand logo (required in layout)",
    `Use this exact logo mark in the composition where appropriate — do not invent a different logo: ${logoUrl}`,
    "Scale and place it legibly; preserve proportions and clear space.",
  ].join("\n");
}

export function buildUploadedLogoBrief(logoUrl: string): string {
  return [
    "## Logo source",
    `Reproduce this uploaded brand mark faithfully on a clean background: ${logoUrl}`,
    "Do not redesign or substitute another symbol.",
  ].join("\n");
}

function buildAssetSection(input: ImagePromptAssemblyInput): string {
  const lines = [
    "## Asset to generate",
    `Deliverable: ${input.assetTitle}`,
    input.catalogId ? `Type: ${input.catalogId}` : "",
    input.category ? `Category: ${input.category}` : "",
    input.aspectRatio ? `Aspect ratio: ${input.aspectRatio}` : "",
    input.variantLabel ? `Variant: ${input.variantLabel}` : "",
    "",
    input.creativeBrief.trim(),
  ];
  return lines.filter(Boolean).join("\n");
}

function buildOutputConstraintsSection(input: ImagePromptAssemblyInput): string {
  return [
    "## Output requirements",
    "Production-quality, on-brand, ready for marketing use.",
    "No watermarks, no placeholder text like 'Lorem ipsum', no UI chrome unless the asset is a mockup.",
    input.isLogoAsset
      ? "Single cohesive logo mark; clean background; no mockup device frames."
      : "Composition should read clearly at a glance on the target platform.",
  ].join("\n");
}

/**
 * Final prompt sent to the image model (after planner brief + runtime refs/logo).
 */
export function assembleImageGenerationPrompt(
  input: ImagePromptAssemblyInput,
): string {
  const sections: string[] = [
    [
      "## Role",
      `You are generating branded marketing imagery for "${input.brand.brandName}".`,
      "Treat brand identity and reference images as hard constraints, not loose suggestions.",
    ].join("\n"),
    buildBrandIdentitySection(input.brand),
    buildAssetSection(input),
  ];

  if (input.useUploadedLogoAsSource && input.logoUrl) {
    sections.push(buildUploadedLogoBrief(input.logoUrl));
  } else if (input.references?.urls.length) {
    sections.push(buildReferenceGuidanceSection(input.references));
  }

  if (input.logoUrl && !input.isLogoAsset && !input.useUploadedLogoAsSource) {
    sections.push(buildLogoGuidanceSection(input.logoUrl));
  }

  sections.push(buildOutputConstraintsSection(input));

  return sections.join("\n\n");
}

/** Compact brand block for Ideas / single-shot generation. */
export function assembleIdeasGenerationPrompt(input: {
  brand: BrandPromptContext;
  userDirection: string;
  presetLines?: string[];
  brandAssetRefs?: { label: string; type: string; url: string }[];
  referenceImageUrls?: string[];
}): string {
  const sections = [
    [
      "## Role",
      `Create on-brand imagery for "${input.brand.brandName}".`,
    ].join("\n"),
    buildBrandIdentitySection(input.brand),
  ];

  if (input.brandAssetRefs?.length) {
    sections.push(
      [
        "## Existing brand assets",
        "Stay consistent with these approved brand assets:",
        ...input.brandAssetRefs.map(
          (a) => `- ${a.label} (${a.type}): ${a.url}`,
        ),
      ].join("\n"),
    );
  }

  if (input.presetLines?.length) {
    sections.push(
      ["## Asset presets", ...input.presetLines.map((l) => `- ${l}`)].join("\n"),
    );
  }

  if (input.userDirection.trim()) {
    sections.push(
      ["## Creative direction", input.userDirection.trim()].join("\n"),
    );
  }

  if (input.referenceImageUrls?.length) {
    sections.push(
      buildReferenceGuidanceSection({
        urls: input.referenceImageUrls,
        names: input.referenceImageUrls.map((_, i) => `Reference ${i + 1}`),
      }),
    );
  }

  sections.push(buildOutputConstraintsSection({ brand: input.brand, creativeBrief: "", assetTitle: "Image" }));

  return sections.join("\n\n");
}
