import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";
import { getDefaultAssetSelections } from "@/lib/brand/asset-catalog";

/** Default palette on a brand-new wizard draft (not treated as user input). */
export const EMPTY_DRAFT_COLORS = {
  primary: "#F86E29",
  secondary: "#111827",
  accent: "#FF9B4D",
} as const;

function selectionsDifferFromDefault(
  selections: BrandProjectDraft["assetSelections"],
): boolean {
  return (
    JSON.stringify(selections) !==
    JSON.stringify(getDefaultAssetSelections())
  );
}

function hasAspectOverrides(
  overrides: BrandProjectDraft["assetAspectOverrides"],
): boolean {
  return Boolean(overrides && Object.keys(overrides).length > 0);
}

/** True when the user entered something worth saving as a draft. */
export function draftHasUserContent(draft: BrandProjectDraft): boolean {
  if (draft.name.trim()) return true;
  if (draft.domain.trim()) return true;
  if (draft.websiteSourceUrl.trim()) return true;
  if (draft.websiteSummary.trim()) return true;
  if (draft.tagline.trim()) return true;
  if (draft.description.trim()) return true;
  if (draft.audience.trim()) return true;
  if (draft.styleNotes.trim()) return true;
  if (draft.sector) return true;
  if (draft.feelings.length > 0) return true;
  if (draft.attachments.length > 0) return true;
  if (draft.logo?.url || draft.logo?.previewUrl) return true;
  if (draft.typography.hasCustomFont) return true;
  if (draft.typography.fontNotes.trim()) return true;
  if (
    draft.colors.primary !== EMPTY_DRAFT_COLORS.primary ||
    draft.colors.secondary !== EMPTY_DRAFT_COLORS.secondary ||
    draft.colors.accent !== EMPTY_DRAFT_COLORS.accent
  ) {
    return true;
  }
  if (selectionsDifferFromDefault(draft.assetSelections)) return true;
  if (hasAspectOverrides(draft.assetAspectOverrides)) return true;
  return false;
}
