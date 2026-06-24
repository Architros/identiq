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
    return "adapt-content";
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
  return "adapt-content";
}

export function defaultRemixPrompt(mode: RemixMode): string {
  const temporal =
    "Update any outdated years or copyright lines to the current year.";
  return mode === "adapt-content"
    ? `Adapt this template for my brand—replace all text and apply my colors and logo. ${temporal}`
    : `Adapt this template for my brand—replace all visible text, then apply my colors and logo. ${temporal}`;
}
