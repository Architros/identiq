import type { IconSvgElement } from "@hugeicons/react";

export type PresetCategory =
  | "social"
  | "advertising"
  | "announcements"
  | "editorial"
  | "quotes"
  | "information"
  | "headers"
  | "product"
  | "merchandise";

export type AspectRatio =
  | "1:1"
  | "9:16"
  | "16:9"
  | "4:5"
  | "2:3"
  | "21:9";

export const ASPECT_RATIO_OPTIONS: {
  value: AspectRatio;
  label: string;
  description: string;
}[] = [
  { value: "1:1", label: "1:1", description: "Square" },
  { value: "9:16", label: "9:16", description: "Story / Reels" },
  { value: "16:9", label: "16:9", description: "Wide" },
  { value: "4:5", label: "4:5", description: "Portrait feed" },
  { value: "2:3", label: "2:3", description: "Pinterest pin" },
  { value: "21:9", label: "21:9", description: "Banner" },
];

export type Resolution = "1K" | "2K";

export type GenerationPreset = {
  id: string;
  category: PresetCategory;
  categoryLabel: string;
  title: string;
  description: string;
  platformIcon: IconSvgElement;
  defaultPrompt: string;
  aspectRatio: AspectRatio;
  suggestedResolution: Resolution;
  platformPixelHint?: string;
  lockAspectRatio: boolean;
};
