import type { LibraryTemplate } from "@/lib/library/types";

/** Grid cell spans for the home hero collage (4×4). */
export const HOME_COLLAGE_LAYOUT = [
  "col-span-2 row-span-2",
  "row-span-2",
  "",
  "",
  "col-span-2",
  "",
  "row-span-2",
  "",
] as const;

export function pickHomeCollageTemplates(
  templates: LibraryTemplate[],
  count = 8,
): LibraryTemplate[] {
  if (templates.length <= count) return templates;

  const withRatio = templates.filter((t) => t.width && t.height);
  const pool = withRatio.length >= count ? withRatio : templates;
  const sorted = [...pool].sort((a, b) => {
    const ra = (a.width ?? 1) / (a.height ?? 1);
    const rb = (b.width ?? 1) / (b.height ?? 1);
    return ra - rb;
  });

  const picks: LibraryTemplate[] = [];
  const used = new Set<string>();

  const take = (t: LibraryTemplate | undefined) => {
    if (!t || used.has(t.id)) return;
    used.add(t.id);
    picks.push(t);
  };

  take(sorted[0]);
  take(sorted[sorted.length - 1]);
  take(sorted[Math.floor(sorted.length / 2)]);

  for (const t of sorted) {
    if (picks.length >= count) break;
    take(t);
  }

  return picks.slice(0, count);
}

/** Several distinct collage panels for marquee scrolling. */
export function pickHomeCollageTemplateSets(
  templates: LibraryTemplate[],
  panelCount = 3,
  tilesPerPanel = 8,
): LibraryTemplate[][] {
  if (templates.length === 0) return [];

  const sets: LibraryTemplate[][] = [];
  const used = new Set<string>();

  for (let p = 0; p < panelCount; p++) {
    const pool = templates.filter((t) => !used.has(t.id));
    const pickFrom = pool.length >= tilesPerPanel ? pool : templates;
    const panel = pickHomeCollageTemplates(pickFrom, tilesPerPanel);
    for (const t of panel) used.add(t.id);
    sets.push(panel);
  }

  return sets;
}
