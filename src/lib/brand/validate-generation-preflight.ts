import {
  getGeneratableAssetCount,
  normalizeAssetSelections,
} from "@/lib/brand/asset-catalog";
import {
  calculateBrandCreationTokenCost,
  getBrandCreationJobs,
} from "@/lib/brand/brand-creation-flow";
import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";
import { getDraftLogoUrl } from "@/lib/brand/draft-media";

export type GenerationPreflightResult =
  | { ok: true; assetCount: number; tokenCost: number }
  | { ok: false; message: string };

function hasValidDomainInput(domain: string): boolean {
  const trimmed = domain.trim();
  if (!trimmed) return false;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

export function validateGenerationPreflight(
  draft: BrandProjectDraft,
  availableTokens: number,
): GenerationPreflightResult {
  if (!draft.name.trim()) {
    return { ok: false, message: "Brand name is required." };
  }
  if (
    !draft.description.trim() &&
    !hasValidDomainInput(draft.domain) &&
    !draft.websiteSummary.trim()
  ) {
    return {
      ok: false,
      message:
        "Add a short description or use your website URL before generating.",
    };
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

  const hasUploadedLogo = Boolean(getDraftLogoUrl(draft));
  const selections = normalizeAssetSelections(draft.assetSelections);
  const packAssetCount = getGeneratableAssetCount(selections, hasUploadedLogo);

  if (packAssetCount === 0 && !hasUploadedLogo) {
    return {
      ok: false,
      message: "Select at least one asset for your brand pack.",
    };
  }

  const creationJobs = getBrandCreationJobs(
    selections,
    draft.assetAspectOverrides,
    { hasUploadedLogo },
  );
  const tokenCost = calculateBrandCreationTokenCost(selections, {
    hasUploadedLogo,
    aspectOverrides: draft.assetAspectOverrides,
  });

  if (availableTokens < tokenCost) {
    return {
      ok: false,
      message: `You need ${tokenCost} tokens but only have ${availableTokens}. Buy more tokens to create your brand.`,
    };
  }

  return { ok: true, assetCount: creationJobs.length, tokenCost };
}
