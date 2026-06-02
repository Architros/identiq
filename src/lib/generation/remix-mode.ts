export type RemixMode = "preserve-design" | "adapt-content";

const ADAPT_CONTENT_CATEGORIES = new Set([
  "ads",
  "flyers",
  "billboards",
  "feature-posts",
  "presentations",
  "education",
  "brand-guidelines",
  "media",
  "fashion",
]);

const PRESERVE_DESIGN_CATEGORIES = new Set([
  "logos",
  "mockups",
  "merch",
  "apparel",
]);

export function resolveRemixMode(category?: string): RemixMode {
  const normalized = category?.trim().toLowerCase() ?? "";
  if (!normalized || normalized === "general") {
    return "preserve-design";
  }
  if (ADAPT_CONTENT_CATEGORIES.has(normalized)) {
    return "adapt-content";
  }
  if (PRESERVE_DESIGN_CATEGORIES.has(normalized)) {
    return "preserve-design";
  }
  if (normalized.startsWith("social")) {
    return "adapt-content";
  }
  return "preserve-design";
}

export function defaultRemixPrompt(mode: RemixMode): string {
  return mode === "adapt-content"
    ? "Adapt this layout for my brand"
    : "Apply my brand colors and logo to this design";
}
