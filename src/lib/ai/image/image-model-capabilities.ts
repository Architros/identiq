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

/** Models we treat with OpenAI-style size + quality parameters. */
export function usesGptImageSizeParams(modelId: string): boolean {
  const family = getImageModelFamily(modelId);
  return family === "gpt_image" || family === "unknown";
}
