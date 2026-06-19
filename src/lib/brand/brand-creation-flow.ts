import {
  expandAssetSelections,
  getEffectiveAssetSelections,
  getCatalogItem,
  normalizeAssetSelections,
  parseCatalogIdFromJobKey,
  type ExpandedAssetJob,
} from "@/lib/brand/asset-catalog";
import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";
import { buildFontFamilyString } from "@/lib/brand/brand-project-draft";
import type { AssetCompleteData } from "@/lib/brand/create-stream-types";
import { getDraftLogoUrl } from "@/lib/brand/draft-media";
import {
  ORCHESTRATION_TOKEN_COST,
  STARTER_PACK_PER_ASSET_TOKEN_COST,
} from "@/lib/brand/starter-pack";
import { sortStarterPackJobs } from "@/lib/brand/sort-starter-pack-jobs";
import type {
  BrandKit,
  BrandMemory,
  BrandReference,
  GeneratedBrandAsset,
} from "@/lib/brand/types";
import type { BrandSummary } from "@/lib/brand/brands";
import { formatDisplayDate } from "@/lib/format-display-date";
import { generatedImagePreviewUrl } from "@/lib/storage/upload-client";
import type { AspectRatio } from "@/lib/generation/presets";

/** Max image generations during the brand creation wizard (logo when not uploaded). */
export const BRAND_CREATION_MAX_GENERATIONS = 1;

/** Jobs run during brand creation — at most one (logo if not uploaded). */
export function getBrandCreationJobs(
  selections: Record<string, number>,
  aspectOverrides?: Record<string, AspectRatio>,
  options?: { hasUploadedLogo?: boolean },
): ExpandedAssetJob[] {
  if (options?.hasUploadedLogo) return [];

  const jobs = sortStarterPackJobs(
    expandAssetSelections(
      getEffectiveAssetSelections(normalizeAssetSelections(selections), options),
      aspectOverrides,
    ),
  );

  const logoJob = jobs.find((job) => job.item.id === "brand-logo");
  if (logoJob) return [logoJob];

  return jobs.slice(0, BRAND_CREATION_MAX_GENERATIONS);
}

export function calculateBrandCreationTokenCost(
  selections?: Record<string, number>,
  options?: { hasUploadedLogo?: boolean; aspectOverrides?: Record<string, AspectRatio> },
): number {
  const jobs = getBrandCreationJobs(selections ?? {}, options?.aspectOverrides, {
    hasUploadedLogo: options?.hasUploadedLogo,
  });
  return (
    ORCHESTRATION_TOKEN_COST +
    jobs.length * STARTER_PACK_PER_ASSET_TOKEN_COST
  );
}

export function buildMemoryFromDraft(draft: BrandProjectDraft): BrandMemory {
  const fontPairing = draft.typography.hasCustomFont
    ? buildFontFamilyString(
        draft.typography.fontPrimary,
        draft.typography.fontSecondary,
      )
    : draft.typography.fontFamily || "Geist Sans";

  return {
    brand_style: draft.styleNotes.trim() || draft.feelings.join(", "),
    primary_color: draft.colors.primary,
    secondary_color: draft.colors.secondary,
    accent_color: draft.colors.accent?.trim() || undefined,
    font_pairing: fontPairing,
    visual_language:
      draft.description.trim() ||
      draft.websiteSummary.trim() ||
      "Clean, modern brand visuals aligned with the stated audience.",
    tone: draft.feelings.join(", ") || "Professional",
  };
}

export type BuildBrandFromWizardParams = {
  draft: BrandProjectDraft;
  brandId: string;
  domain: string;
  displayName: string;
  memory: BrandMemory;
  imageModel?: string;
  uploadedLogoUrl?: string;
  assetResults?: Map<string, AssetCompleteData>;
  /** When true, logo must be present (uploaded or generated). */
  requireLogo?: boolean;
};

export type BuildBrandFromWizardResult =
  | {
      ok: true;
      kit: BrandKit;
      summary: BrandSummary;
      generated: Omit<GeneratedBrandAsset, "status">[];
      references: BrandReference[];
    }
  | { ok: false; error: string };

export function buildBrandFromWizard(
  params: BuildBrandFromWizardParams,
): BuildBrandFromWizardResult {
  const {
    draft,
    brandId,
    domain,
    displayName,
    memory,
    imageModel = "openai/gpt-5.4-image-2",
    uploadedLogoUrl: uploadedLogoUrlParam,
    assetResults = new Map(),
    requireLogo = true,
  } = params;

  const now = new Date().toISOString();
  const kitAssets: BrandKit["assets"] = [];
  let logoSaved = false;
  const generated: Omit<GeneratedBrandAsset, "status">[] = [];

  const references: BrandReference[] = draft.attachments
    .filter((a) => Boolean(a.url))
    .map((a) => ({
      id: a.id,
      brandId,
      name: a.name,
      type: a.type,
      url: a.url!,
      source: "wizard" as const,
      createdAt: now,
    }));

  const uploadedLogoUrl =
    uploadedLogoUrlParam ?? getDraftLogoUrl(draft) ?? undefined;

  if (uploadedLogoUrl) {
    kitAssets.push({
      type: "logo_primary",
      url: uploadedLogoUrl,
      label: "Brand logo",
    });
    logoSaved = true;
    if (
      draft.logo?.url &&
      !references.some((r) => r.id === draft.logo!.id)
    ) {
      references.unshift({
        id: draft.logo.id,
        brandId,
        name: draft.logo.name,
        type: draft.logo.type,
        url: draft.logo.url,
        source: "wizard",
        createdAt: now,
      });
    }
  }

  for (const [jobKey, result] of assetResults) {
    const catalogId = parseCatalogIdFromJobKey(jobKey);
    const catalogItem = getCatalogItem(catalogId);
    if (!catalogItem) continue;

    const previewUrl =
      generatedImagePreviewUrl(result) ??
      `data:${result.mediaType};base64,${result.base64 ?? ""}`;

    if (catalogId === "brand-logo" && !logoSaved) {
      kitAssets.push({
        type: "logo_primary",
        url: previewUrl,
        label: "Brand logo",
      });
      logoSaved = true;
    }

    generated.push({
      id: `asset_${brandId}_${jobKey}`,
      brandId,
      jobId: jobKey,
      catalogId,
      category: catalogItem.category,
      source: "starter-pack",
      presetId: catalogItem.presetId,
      presetTitle: result.title,
      prompt: result.composedPrompt ?? catalogItem.prompt,
      composedPrompt: result.composedPrompt ?? catalogItem.prompt,
      previewUrl,
      mediaType: result.mediaType,
      aspectRatio: result.aspectRatio,
      model: imageModel,
      createdAt: now,
    });
  }

  if (requireLogo && !logoSaved) {
    return {
      ok: false,
      error: "Add or generate a logo before saving your brand.",
    };
  }

  const kit: BrandKit = {
    id: brandId,
    domain,
    displayName,
    memory,
    assets: kitAssets,
    references,
    description:
      draft.description.trim() || draft.websiteSummary.trim() || undefined,
    tagline: draft.tagline || undefined,
    sector: draft.sector || undefined,
    feelings: draft.feelings,
  };

  const summary: BrandSummary = {
    id: brandId,
    domain,
    displayName,
    avatar: {
      bg: memory.primary_color,
      color: "#ffffff",
      letter: displayName.charAt(0).toUpperCase(),
    },
    imageCount: generated.length,
    updatedAt: formatDisplayDate(new Date()),
  };

  return { ok: true, kit, summary, generated, references };
}
