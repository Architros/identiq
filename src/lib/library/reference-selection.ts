import type { GenerationPreset } from "@/lib/generation/presets";
import { libraryTemplates } from "@/lib/library/templates";

const PRESET_TO_LIBRARY_CATEGORY: Record<string, string[]> = {
  social: ["social-posts", "x-posts", "x-banners", "youtube-covers"],
  advertising: ["ads", "billboards", "flyers", "feature-posts"],
  announcements: ["feature-posts", "ads", "social-posts"],
  editorial: ["presentations", "workflows", "saas-intro"],
  quotes: ["social-posts", "feature-posts"],
  information: ["presentations", "workflows", "brand-guidelines"],
  headers: ["x-banners", "youtube-covers", "presentations"],
  product: ["mockups", "ads", "feature-posts"],
  merchandise: ["merch", "apparel", "mockups"],
};

function targetCategoriesFromPresets(presets: GenerationPreset[]): Set<string> {
  const categories = new Set<string>();
  for (const preset of presets) {
    const mapped = PRESET_TO_LIBRARY_CATEGORY[preset.category] ?? [];
    mapped.forEach((categoryId) => categories.add(categoryId));
  }
  if (categories.size === 0) {
    categories.add("feature-posts");
    categories.add("social-posts");
  }
  return categories;
}

export function selectCategoryMatchedLibraryReferences(params: {
  presets: GenerationPreset[];
  maxCount: number;
  excludeUrls?: string[];
}): Array<{ url: string; name: string }> {
  const maxCount = Math.max(0, params.maxCount);
  if (maxCount === 0) return [];

  const exclude = new Set(params.excludeUrls ?? []);
  const categories = targetCategoriesFromPresets(params.presets);
  const candidates = libraryTemplates.filter(
    (template) =>
      categories.has(template.category) &&
      !exclude.has(template.imageUrl) &&
      template.imageUrl.length > 0,
  );

  if (candidates.length === 0) return [];

  // Deterministic selection to keep outputs stable across rerenders.
  const selected = candidates
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, maxCount);

  return selected.map((template) => ({
    url: template.imageUrl,
    name: template.title ?? "Library inspiration",
  }));
}
