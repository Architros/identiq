export type ImageModelFamily = "gpt_image" | "gemini_image" | "unknown";

export function getImageModelFamily(modelId: string): ImageModelFamily {
  const id = modelId.toLowerCase();
  if (
    id.includes("gemini") &&
    (id.includes("image") || id.includes("imagen"))
  ) {
    return "gemini_image";
  }
  if (
    id.startsWith("openai/") ||
    id.includes("gpt-image") ||
    (id.includes("gpt-5") && id.includes("image"))
  ) {
    return "gpt_image";
  }
  return "unknown";
}

/** OpenRouter image API uses aspectRatio + image_config only (not `size`). */
export function usesGptImageSizeParams(_modelId: string): boolean {
  return false;
}
