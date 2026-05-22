import {
  extendedGenerationPresets,
  extendedPresetCategories,
} from "@/lib/generation/presets-extended";
import { PRESET_ICONS } from "@/lib/generation/preset-icons";
import type {
  AspectRatio,
  GenerationPreset,
  PresetCategory,
  Resolution,
} from "@/lib/generation/presets-types";

export type {
  AspectRatio,
  GenerationPreset,
  PresetCategory,
  Resolution,
} from "@/lib/generation/presets-types";
export { ASPECT_RATIO_OPTIONS } from "@/lib/generation/presets-types";

const coreGenerationPresets: GenerationPreset[] = [
  {
    id: "linkedin-post",
    category: "social",
    categoryLabel: "Social Media",
    title: "LinkedIn Post",
    description: "Professional square post for feed engagement",
    platformIcon: PRESET_ICONS.linkedinPost,
    defaultPrompt:
      "A polished LinkedIn post graphic featuring the brand logo and primary colors, clean typography, and a clear focal message. Compose strictly for 1:1 aspect ratio (1:1 · Square).",
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
    platformIcon: PRESET_ICONS.instagramStory,
    defaultPrompt:
      "A vertical Instagram Story showing on-brand visuals with bold typography and the brand accent color as highlights. Compose strictly for 9:16 aspect ratio (9:16 · Story / Reels).",
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
    platformIcon: PRESET_ICONS.instagramPost,
    defaultPrompt:
      "An Instagram feed post with balanced composition, brand colors, and space for a short headline. Compose strictly for 4:5 aspect ratio (4:5 · Portrait feed).",
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
    platformIcon: PRESET_ICONS.xPost,
    defaultPrompt:
      "An X/Twitter post graphic with crisp layout, brand logo placement, and high-contrast readable text areas. Compose strictly for 16:9 aspect ratio (16:9 · Wide).",
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
    platformIcon: PRESET_ICONS.youtubeThumbnail,
    defaultPrompt:
      "A YouTube thumbnail with dramatic composition, brand colors, and large readable title treatment. Compose strictly for 16:9 aspect ratio (16:9 · Wide).",
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
    platformIcon: PRESET_ICONS.pinterestPin,
    defaultPrompt:
      "A Pinterest pin with vertical layout, elegant brand styling, and inspirational visual mood. Compose strictly for 2:3 aspect ratio (2:3 · Pinterest pin).",
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
    platformIcon: PRESET_ICONS.linkedinBanner,
    defaultPrompt:
      "A wide LinkedIn banner with brand logo, gradient using primary and secondary colors, and minimal tagline space. Compose strictly for 21:9 aspect ratio (21:9 · Banner).",
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
    platformIcon: PRESET_ICONS.socialMediaAd,
    defaultPrompt:
      "A social media ad creative with strong hook visual, brand palette, logo, and clear call-to-action area. Compose strictly for 1:1 aspect ratio (1:1 · Square).",
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
    platformIcon: PRESET_ICONS.displayBanner,
    defaultPrompt:
      "A horizontal display ad banner with brand identity, product focal point, and clean negative space. Compose strictly for 21:9 aspect ratio (21:9 · Banner).",
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
    platformIcon: PRESET_ICONS.customerTestimonial,
    defaultPrompt:
      "A testimonial graphic with quote typography, subtle brand frame, logo, and trust-building layout. Compose strictly for 4:5 aspect ratio (4:5 · Portrait feed).",
    aspectRatio: "4:5",
    suggestedResolution: "2K",
    platformPixelHint: "Portrait quote card · 4:5",
    lockAspectRatio: true,
  },
];

export const generationPresets: GenerationPreset[] = [
  ...coreGenerationPresets,
  ...extendedGenerationPresets,
];

export const presetCategories: { id: PresetCategory; label: string }[] = [
  { id: "social", label: "Social Media" },
  { id: "advertising", label: "Advertising" },
  ...extendedPresetCategories,
];

export function getPresetsByCategory(category: PresetCategory) {
  return generationPresets.filter((p) => p.category === category);
}

export function getPresetById(id: string) {
  return generationPresets.find((p) => p.id === id);
}
