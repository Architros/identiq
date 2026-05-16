import {
  getTotalSelectedAssets,
  normalizeAssetSelections,
} from "@/lib/brand/asset-catalog";
import { calculateStarterPackTokenCost } from "@/lib/brand/starter-pack";
import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";

export type GenerationPreflightResult =
  | { ok: true; assetCount: number; tokenCost: number }
  | { ok: false; message: string };

export function validateGenerationPreflight(
  draft: BrandProjectDraft,
  availableTokens: number,
): GenerationPreflightResult {
  if (!draft.name.trim()) {
    return { ok: false, message: "Brand name is required." };
  }
  if (!draft.description.trim()) {
    return { ok: false, message: "Brand description is required." };
  }
  if (!draft.sector) {
    return { ok: false, message: "Select a sector before generating." };
  }
  if (draft.feelings.length === 0) {
    return { ok: false, message: "Pick at least one brand feeling." };
  }
  if (!draft.colors.primary) {
    return { ok: false, message: "Primary color is required." };
  }

  const uploading = draft.attachments.some((a) => a.uploading);
  if (uploading) {
    return {
      ok: false,
      message: "Wait for reference uploads to finish before generating.",
    };
  }

  const uploadFailed = draft.attachments.some((a) => a.uploadError);
  if (uploadFailed) {
    return {
      ok: false,
      message: "Remove or re-upload failed reference files.",
    };
  }

  const selections = normalizeAssetSelections(draft.assetSelections);
  const assetCount = getTotalSelectedAssets(selections);
  if (assetCount === 0) {
    return {
      ok: false,
      message: "Select at least one asset to generate.",
    };
  }

  const tokenCost = calculateStarterPackTokenCost(selections);
  if (availableTokens < tokenCost) {
    return {
      ok: false,
      message: `You need ${tokenCost} tokens but only have ${availableTokens}. Buy more tokens or reduce your asset pack.`,
    };
  }

  return { ok: true, assetCount, tokenCost };
}
