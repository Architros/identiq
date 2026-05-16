import type { ExpandedAssetJob } from "@/lib/brand/asset-catalog";
import type { PlannedStarterPackJob } from "@/lib/brand/plan-starter-pack-prompts";

export type JobImagePromptContext = {
  attachmentNames?: string[];
  attachmentUrls?: string[];
  logoUrl?: string;
};

function referenceBlock(ctx: JobImagePromptContext): string {
  const names = ctx.attachmentNames ?? [];
  const urls = ctx.attachmentUrls ?? [];
  if (urls.length === 0) return "";

  const lines = urls.map((url, i) => {
    const name = names[i] ?? `Reference ${i + 1}`;
    return `- ${name}: ${url}`;
  });

  return [
    "",
    "Brand reference images (match mood, palette, and visual cues where relevant):",
    ...lines,
  ].join("\n");
}

function logoBlock(logoUrl: string): string {
  return [
    "",
    `Brand logo reference (incorporate or echo this mark in layout/composition where appropriate): ${logoUrl}`,
  ].join("\n");
}

/** Assemble the final image model prompt from planner output + runtime references. */
export function buildJobImagePrompt(
  job: ExpandedAssetJob,
  planned: PlannedStarterPackJob,
  ctx: JobImagePromptContext,
): string {
  const parts = [planned.prompt.trim()];

  const refs = referenceBlock(ctx);
  if (refs) parts.push(refs);

  const isLogo =
    job.item.id === "brand-logo" ||
    job.item.kind === "logo";

  if (!isLogo && ctx.logoUrl) {
    parts.push(logoBlock(ctx.logoUrl));
  }

  return parts.join("\n");
}
