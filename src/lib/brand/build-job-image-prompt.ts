import type { ExpandedAssetJob } from "@/lib/brand/asset-catalog";
import type { PlannedStarterPackJob } from "@/lib/brand/plan-starter-pack-prompts";
import {
  assembleImageGenerationPrompt,
  type BrandPromptContext,
  type ReferencePromptBundle,
} from "@/lib/brand/prompt-structure";

export type JobImagePromptContext = {
  brand: BrandPromptContext;
  attachmentNames?: string[];
  attachmentUrls?: string[];
  logoUrl?: string;
};

function referencesFromContext(ctx: JobImagePromptContext): ReferencePromptBundle | undefined {
  const urls = ctx.attachmentUrls ?? [];
  if (urls.length === 0) return undefined;
  return {
    urls,
    names: ctx.attachmentNames ?? urls.map((_, i) => `Reference ${i + 1}`),
  };
}

/** Assemble the final image model prompt from planner output + runtime references. */
export function buildJobImagePrompt(
  job: ExpandedAssetJob,
  planned: PlannedStarterPackJob,
  ctx: JobImagePromptContext,
): string {
  const isLogo =
    job.item.id === "brand-logo" || job.item.kind === "logo";

  return assembleImageGenerationPrompt({
    brand: ctx.brand,
    creativeBrief: planned.prompt.trim(),
    assetTitle: planned.variantLabel
      ? `${job.item.title} — ${planned.variantLabel}`
      : job.item.title,
    catalogId: job.item.id,
    category: job.item.category,
    aspectRatio: job.aspectRatio,
    variantLabel: planned.variantLabel,
    references: referencesFromContext(ctx),
    logoUrl: ctx.logoUrl,
    isLogoAsset: isLogo,
    useUploadedLogoAsSource: isLogo && Boolean(ctx.logoUrl),
  });
}
