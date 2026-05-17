import type { BrandFeeling, BrandSector } from "@/lib/brand/brand-project-draft";
import { BRAND_FEELINGS, BRAND_SECTORS } from "@/lib/brand/brand-project-draft";

/** Image-model guidance per personality tag (used when no reference images). */
export const FEELING_VISUAL_INSPIRATION: Record<BrandFeeling, string> = {
  premium:
    "Refined layouts with generous whitespace, subtle depth, restrained typography, soft shadows, and a polished editorial finish. Avoid clutter and loud gradients.",
  playful:
    "Bright, energetic compositions with rounded shapes, friendly illustration or photography, dynamic angles, and approachable color pops. Keep it fun without chaos.",
  minimal:
    "Clean grids, lots of negative space, limited palette, sharp type hierarchy, flat or lightly textured backgrounds, and one clear focal element per frame.",
  bold:
    "High contrast, oversized type, strong geometric shapes, confident color blocking, and dramatic cropping. Make the brand feel unmistakable at a glance.",
  friendly:
    "Warm lighting, human-centered photography, soft corners, inviting copy areas, and approachable color harmony. The mood should feel helpful and human.",
  luxury:
    "Elegant spacing, rich materials (marble, silk, metal), muted metallics, serif or refined sans typography, and aspirational photography with controlled highlights.",
  innovative:
    "Future-forward aesthetic: crisp UI-like layouts, subtle glows, tech textures, gradient accents used sparingly, and a sense of motion or progress.",
  trustworthy:
    "Calm, credible compositions: balanced layout, readable type, stable horizons, professional photography, and conservative use of accent color.",
};

const SECTOR_VISUAL_INSPIRATION: Partial<Record<BrandSector, string>> = {
  technology:
    "Clean product/UI sensibility, subtle gradients, crisp iconography, and modern sans-serif typography.",
  food_beverage:
    "Appetizing photography, warm tones, organic textures, and inviting close-up compositions.",
  fashion:
    "Editorial photography, strong styling, aspirational models or flat-lay, and trend-aware layouts.",
  health_wellness:
    "Fresh, airy palettes, natural light, calm compositions, and authentic lifestyle imagery.",
  finance:
    "Structured grids, professional photography, data-friendly layouts, and conservative visual hierarchy.",
  education:
    "Clear information hierarchy, friendly illustration mixed with photography, and accessible readability.",
  real_estate:
    "Spacious architectural photography, natural light, premium materials, and wide compositions.",
  entertainment:
    "Dynamic contrast, bold typography, cinematic crops, and high-energy visual rhythm.",
  nonprofit:
    "Human stories, authentic photography, hopeful tone, and clear emotional focal points.",
};

export function resolveFeelingLabels(feelingIds: string[]): string[] {
  return feelingIds.map(
    (id) => BRAND_FEELINGS.find((f) => f.id === id)?.label ?? id,
  );
}

export function getVisualInspirationLines(feelingIds: string[]): string[] {
  const lines: string[] = [];
  for (const id of feelingIds) {
    const cue = FEELING_VISUAL_INSPIRATION[id as BrandFeeling];
    if (!cue) continue;
    const label = BRAND_FEELINGS.find((f) => f.id === id)?.label ?? id;
    lines.push(`${label}: ${cue}`);
  }
  return lines;
}

export function buildVisualInspirationSection(input: {
  feelingIds: string[];
  sector?: string;
  /** When true, reference images take priority — skip tag-based inspiration. */
  hasReferenceImages: boolean;
}): string | undefined {
  if (input.hasReferenceImages) return undefined;

  const feelingLines = getVisualInspirationLines(input.feelingIds);
  const sectorCue =
    input.sector && input.sector in SECTOR_VISUAL_INSPIRATION
      ? SECTOR_VISUAL_INSPIRATION[input.sector as BrandSector]
      : undefined;

  if (feelingLines.length === 0 && !sectorCue) return undefined;

  const parts = [
    "## Visual inspiration (personality tags)",
    "No reference images were provided. Use these brand personality tags as the primary visual guide — palette usage, lighting, composition, and mood should reflect them:",
  ];

  if (feelingLines.length > 0) {
    parts.push(...feelingLines.map((l) => `- ${l}`));
  }

  if (sectorCue && input.sector) {
    const sectorLabel =
      BRAND_SECTORS.find((s) => s.id === input.sector)?.label ??
      input.sector.replace(/_/g, " ");
    parts.push("", `Sector context (${sectorLabel}): ${sectorCue}`);
  }

  parts.push(
    "",
    "Do not default to generic stock aesthetics; the output must feel intentional for this brand's tags and identity.",
  );

  return parts.join("\n");
}
