import type { BrandKit } from "@/lib/brand/types";
import type { BrandAssetType } from "@/lib/brand/types";
import { resolveFeelingLabels } from "@/lib/brand/visual-inspiration";

const LOGO_PRIORITY: BrandAssetType[] = [
  "logo_icon",
  "logo_primary",
  "logo_secondary",
  "logo_monochrome",
  "logo_white",
];

export function pickBrandLogoUrl(kit: BrandKit | undefined): string | null {
  if (!kit?.assets?.length) return null;
  for (const type of LOGO_PRIORITY) {
    const asset = kit.assets.find((a) => a.type === type && a.url?.trim());
    if (asset) return asset.url.trim();
  }
  return null;
}

export function brandColorPair(kit: BrandKit | undefined): {
  primary: string;
  secondary: string;
} {
  const primary = kit?.memory.primary_color?.trim() || "#111827";
  const secondary = kit?.memory.secondary_color?.trim() || "#6B7280";
  return { primary, secondary };
}

/** Palette row for brand cards (primary, light, secondary, neutral). */
export function brandPaletteSwatches(kit: BrandKit | undefined): string[] {
  const { primary, secondary } = brandColorPair(kit);
  return [primary, "#ffffff", secondary, "#e8eaed"];
}

export function brandTraitTags(kit: BrandKit | undefined): string[] {
  if (!kit) return [];
  const tags: string[] = [];
  if (kit.feelings?.length) {
    tags.push(...resolveFeelingLabels(kit.feelings));
  }
  const style = kit.memory.brand_style?.trim();
  if (style) {
    for (const word of style.split(/[\s,]+/)) {
      const w = word.trim().toLowerCase();
      if (w.length > 2) tags.push(w);
    }
  }
  const tone = kit.memory.tone?.trim();
  if (tone) {
    for (const word of tone.split(/[\s,]+/)) {
      const w = word.trim().toLowerCase();
      if (w.length > 2) tags.push(w);
    }
  }
  const seen = new Set<string>();
  return tags.filter((t) => {
    const key = t.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
