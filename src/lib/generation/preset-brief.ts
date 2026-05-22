export type AspectRatio =
  | "1:1"
  | "9:16"
  | "16:9"
  | "4:5"
  | "2:3"
  | "21:9";

const RATIO_META: Record<
  AspectRatio,
  { label: string; description: string }
> = {
  "1:1": { label: "1:1", description: "Square" },
  "9:16": { label: "9:16", description: "Story / Reels" },
  "16:9": { label: "16:9", description: "Wide" },
  "4:5": { label: "4:5", description: "Portrait feed" },
  "2:3": { label: "2:3", description: "Pinterest pin" },
  "21:9": { label: "21:9", description: "Banner" },
};

/**
 * Asset-specific creative brief for Ideas presets. Brand identity is injected
 * separately via assembleIdeasGenerationPrompt — this focuses on layout and format.
 */
export function presetBrief(parts: {
  deliverable: string;
  composition: string;
  aspectRatio: AspectRatio;
  platformHint?: string;
}): string {
  const ratioMeta = RATIO_META[parts.aspectRatio];
  return [
    parts.deliverable,
    parts.composition,
    "Use this brand's primary and secondary colors, logo mark, typography pairing, visual language, and tone throughout — unmistakably on-brand, never generic template stock.",
    `Compose strictly for ${parts.aspectRatio} aspect ratio (${ratioMeta.label} · ${ratioMeta.description}).`,
    parts.platformHint ? parts.platformHint : "",
  ]
    .filter(Boolean)
    .join(" ");
}
