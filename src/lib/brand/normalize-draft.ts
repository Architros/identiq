import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";
import { WIZARD_STEP_COUNT } from "@/lib/brand/brand-project-draft";
import {
  COLOR_PRESETS,
  buildFontFamilyString,
} from "@/lib/brand/brand-project-draft";
import { getDefaultAssetSelections, normalizeAssetSelections } from "@/lib/brand/asset-catalog";

function normalizeHex(value: string): string {
  return value.trim().toUpperCase();
}

function resolveAccentColor(
  primary: string,
  secondary: string,
  accent?: string,
): string | undefined {
  if (accent?.trim()) return accent;
  const match = COLOR_PRESETS.find(
    (preset) =>
      normalizeHex(preset.primary) === normalizeHex(primary) &&
      normalizeHex(preset.secondary) === normalizeHex(secondary),
  );
  return match?.accent;
}

function normalizeTypography(
  raw?: BrandProjectDraft["typography"],
): BrandProjectDraft["typography"] {
  const base = {
    hasCustomFont: false,
    fontPrimary: "",
    fontSecondary: "",
    fontFamily: "",
    fontNotes: "",
  };
  if (!raw) return base;

  let fontPrimary = raw.fontPrimary?.trim() ?? "";
  let fontSecondary = raw.fontSecondary?.trim() ?? "";
  const legacyFamily = raw.fontFamily?.trim() ?? "";

  if (!fontPrimary && legacyFamily) {
    const parts = legacyFamily.split(/\s*\+\s*/).map((p) => p.trim());
    fontPrimary = parts[0] ?? "";
    fontSecondary = parts[1] ?? "";
  }

  const fontFamily =
    legacyFamily || buildFontFamilyString(fontPrimary, fontSecondary);

  return {
    hasCustomFont: raw.hasCustomFont ?? false,
    fontPrimary,
    fontSecondary,
    fontFamily,
    fontNotes: raw.fontNotes?.trim() ?? "",
  };
}

export function normalizeBrandDraft(draft: BrandProjectDraft): BrandProjectDraft {
  const primary = draft.colors?.primary ?? "#F86E29";
  const secondary = draft.colors?.secondary ?? "#111827";

  const logo =
    draft.logo && typeof draft.logo === "object"
      ? {
          ...draft.logo,
          previewUrl: draft.logo.url ?? draft.logo.previewUrl,
        }
      : null;

  const status =
    draft.status === "generating"
      ? "draft"
      : draft.status;
  const step =
    draft.status === "generating"
      ? Math.min(draft.step, WIZARD_STEP_COUNT - 1)
      : draft.step;

  return {
    ...draft,
    status,
    step,
    logo,
    websiteSourceUrl: draft.websiteSourceUrl?.trim() ?? "",
    websiteSummary: draft.websiteSummary?.trim() ?? "",
    websiteFetchedAt: draft.websiteFetchedAt?.trim() ?? "",
    websiteFetchStatus:
      draft.websiteFetchStatus === "loading" ||
      draft.websiteFetchStatus === "done" ||
      draft.websiteFetchStatus === "error"
        ? draft.websiteFetchStatus
        : "idle",
    websiteFetchError: draft.websiteFetchError?.trim() ?? "",
    typography: normalizeTypography(draft.typography),
    assetSelections: normalizeAssetSelections(
      draft.assetSelections ?? getDefaultAssetSelections(),
    ),
    colors: {
      primary,
      secondary,
      accent: resolveAccentColor(primary, secondary, draft.colors?.accent),
    },
  };
}
