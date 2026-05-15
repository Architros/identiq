import type { Resolution } from "@/lib/generation/presets";

export type TokenCostInput = {
  presetCount: number;
  hasPrompt: boolean;
  quantity: number;
  resolution: Resolution;
  imageAssistEnabled: boolean;
  referenceImageCount: number;
};

export function calculateGenerationTokenCost(input: TokenCostInput): number {
  const hasWork = input.presetCount > 0 || input.hasPrompt;
  if (!hasWork) return 0;

  const jobs = Math.max(input.presetCount, 1);
  const resolutionMultiplier = input.resolution === "2K" ? 2 : 1;
  const assistCost = input.imageAssistEnabled ? 1 : 0;
  const referenceCost = input.referenceImageCount;

  return jobs * input.quantity * resolutionMultiplier + assistCost + referenceCost;
}
