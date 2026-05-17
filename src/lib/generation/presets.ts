import type { IconSvgElement } from "@hugeicons/react";
import {
  Linkedin01Icon,
  InstagramIcon,
  NewTwitterIcon,
  YoutubeIcon,
  PinterestIcon,
  Megaphone01Icon,
  Image01Icon,
  QuoteDownCircleIcon,
} from "@hugeicons/core-free-icons";

export type PresetCategory = "social" | "advertising";

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
  /** Display-only platform target dimensions */
  platformPixelHint?: string;
  lockAspectRatio: boolean;
};

export const generationPresets: GenerationPreset[] = [
  {
    id: "linkedin-post",
    category: "social",
    categoryLabel: "Social Media",
    title: "LinkedIn Post",
    description: "Professional square post for feed engagement",
    platformIcon: Linkedin01Icon,
    defaultPrompt:
      "A polished LinkedIn post graphic featuring the brand logo and primary colors, clean typography, and a clear focal message.",
    aspectRatio: "1:1",
    suggestedResolution: "2K",
    platformPixelHint: "LinkedIn feed · 1200×1200 recommended",
    lockAspectRatio: true,
  },
  {
    id: "instagram-story",
    category: "social",
    categoryLabel: "Social Media",
    title: "Instagram Story",
    description: "Quick vertical content for stories and reels",
    platformIcon: InstagramIcon,
    defaultPrompt:
      "A vertical Instagram Story showing on-brand visuals with bold typography and the brand accent color as highlights.",
    aspectRatio: "9:16",
    suggestedResolution: "2K",
    platformPixelHint: "Story/Reels · 1080×1920",
    lockAspectRatio: true,
  },
  {
    id: "instagram-post",
    category: "social",
    categoryLabel: "Social Media",
    title: "Instagram Post",
    description: "Portrait feed post with strong visual hierarchy",
    platformIcon: InstagramIcon,
    defaultPrompt:
      "An Instagram feed post with balanced composition, brand colors, and space for a short headline.",
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Instagram feed · 1080×1350 (4:5)",
    lockAspectRatio: true,
  },
  {
    id: "x-post",
    category: "social",
    categoryLabel: "Social Media",
    title: "X Post",
    description: "Landscape post optimized for X/Twitter",
    platformIcon: NewTwitterIcon,
    defaultPrompt:
      "An X/Twitter post graphic with crisp layout, brand logo placement, and high-contrast readable text areas.",
    aspectRatio: "16:9",
    suggestedResolution: "2K",
    platformPixelHint: "X card image · 16:9 landscape",
    lockAspectRatio: true,
  },
  {
    id: "youtube-thumbnail",
    category: "social",
    categoryLabel: "Social Media",
    title: "YouTube Thumbnail",
    description: "Eye-catching thumbnail for video content",
    platformIcon: YoutubeIcon,
    defaultPrompt:
      "A YouTube thumbnail with dramatic composition, brand colors, and large readable title treatment.",
    aspectRatio: "16:9",
    suggestedResolution: "2K",
    platformPixelHint: "YouTube · 1280×720 minimum",
    lockAspectRatio: true,
  },
  {
    id: "pinterest-pin",
    category: "social",
    categoryLabel: "Social Media",
    title: "Pinterest Pin",
    description: "Tall pin format for discovery and saves",
    platformIcon: PinterestIcon,
    defaultPrompt:
      "A Pinterest pin with vertical layout, elegant brand styling, and inspirational visual mood.",
    aspectRatio: "2:3",
    suggestedResolution: "2K",
    platformPixelHint: "Pinterest · 1000×1500 (2:3)",
    lockAspectRatio: true,
  },
  {
    id: "linkedin-banner",
    category: "advertising",
    categoryLabel: "Advertising",
    title: "LinkedIn Banner",
    description: "Wide banner for profile or campaign headers",
    platformIcon: Linkedin01Icon,
    defaultPrompt:
      "A wide LinkedIn banner with brand logo, gradient using primary and secondary colors, and minimal tagline space.",
    aspectRatio: "21:9",
    suggestedResolution: "2K",
    platformPixelHint:
      "LinkedIn cover ~1584×396 (4:1) — using widest supported ratio; may crop",
    lockAspectRatio: true,
  },
  {
    id: "social-media-ad",
    category: "advertising",
    categoryLabel: "Advertising",
    title: "Social Media Ad",
    description: "Paid social creative with CTA-friendly layout",
    platformIcon: Megaphone01Icon,
    defaultPrompt:
      "A social media ad creative with strong hook visual, brand palette, logo, and clear call-to-action area.",
    aspectRatio: "1:1",
    suggestedResolution: "2K",
    platformPixelHint: "Paid social · 1:1 square",
    lockAspectRatio: true,
  },
  {
    id: "display-banner",
    category: "advertising",
    categoryLabel: "Advertising",
    title: "Display Banner",
    description: "Horizontal banner for web display placements",
    platformIcon: Image01Icon,
    defaultPrompt:
      "A horizontal display ad banner with brand identity, product focal point, and clean negative space.",
    aspectRatio: "21:9",
    suggestedResolution: "2K",
    platformPixelHint: "Display · wide leaderboard-style",
    lockAspectRatio: true,
  },
  {
    id: "customer-testimonial",
    category: "advertising",
    categoryLabel: "Advertising",
    title: "Customer Testimonial",
    description: "Quote-led creative with brand framing",
    platformIcon: QuoteDownCircleIcon,
    defaultPrompt:
      "A testimonial graphic with quote typography, subtle brand frame, logo, and trust-building layout.",
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Portrait quote card · 4:5",
    lockAspectRatio: true,
  },
];

export const presetCategories = [
  { id: "social" as const, label: "Social Media" },
  { id: "advertising" as const, label: "Advertising" },
];

export function getPresetsByCategory(category: PresetCategory) {
  return generationPresets.filter((p) => p.category === category);
}

export function getPresetById(id: string) {
  return generationPresets.find((p) => p.id === id);
}
