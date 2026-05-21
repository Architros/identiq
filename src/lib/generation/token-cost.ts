import type { Resolution } from "@/lib/generation/presets";

export type TokenCostInput = {
  presetCount: number;
  hasPrompt: boolean;
  /** Library template remix counts as a generation job without user text. */
  isLibraryRemix?: boolean;
  quantity: number;
  resolution: Resolution;
  referenceImageCount: number;
};

export function calculateGenerationTokenCost(input: TokenCostInput): number {
  const hasWork =
    input.presetCount > 0 || input.hasPrompt || Boolean(input.isLibraryRemix);
  if (!hasWork) return 0;

  const jobs = Math.max(input.presetCount, 1);
  const resolutionMultiplier = input.resolution === "2K" ? 2 : 1;
  const referenceCost = input.referenceImageCount;

  return jobs * input.quantity * resolutionMultiplier + referenceCost;
}
