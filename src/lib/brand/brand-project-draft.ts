import { getDefaultAssetSelections } from "@/lib/brand/asset-catalog";

export type BrandSector =
  | "technology"
  | "food_beverage"
  | "fashion"
  | "health_wellness"
  | "finance"
  | "education"
  | "real_estate"
  | "entertainment"
  | "nonprofit"
  | "other";

export type BrandFeeling =
  | "premium"
  | "playful"
  | "minimal"
  | "bold"
  | "friendly"
  | "luxury"
  | "innovative"
  | "trustworthy";

export type BrandAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
};

export type BrandTypography = {
  hasCustomFont: boolean;
  fontPrimary: string;
  fontSecondary: string;
  /** Derived display string for orchestration API, e.g. "Inter + Playfair Display" */
  fontFamily: string;
  fontNotes: string;
};

export function buildFontFamilyString(
  primary: string,
  secondary: string,
): string {
  const p = primary.trim();
  const s = secondary.trim();
  if (p && s && p !== s) return `${p} + ${s}`;
  return p || s;
}

export type BrandProjectDraft = {
  id: string;
  step: number;
  name: string;
  domain: string;
  tagline: string;
  description: string;
  sector: BrandSector | "";
  feelings: BrandFeeling[];
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  typography: BrandTypography;
  audience: string;
  styleNotes: string;
  attachments: BrandAttachment[];
  /** itemId → quantity (0 = skip) */
  assetSelections: Record<string, number>;
  status: "draft" | "generating" | "completed";
  updatedAt: string;
};

export const WIZARD_STEP_COUNT = 8;

export const WIZARD_STEP_LABELS = [
  "Basics",
  "Sector",
  "Feeling",
  "Colors",
  "Audience",
  "References",
  "Assets",
  "Review",
] as const;

export const BRAND_SECTORS: {
  id: BrandSector;
  label: string;
  description: string;
}[] = [
  { id: "technology", label: "Technology", description: "SaaS, apps, AI, hardware" },
  { id: "food_beverage", label: "Food & Beverage", description: "Restaurants, CPG, cafes" },
  { id: "fashion", label: "Fashion & Beauty", description: "Apparel, cosmetics, lifestyle" },
  { id: "health_wellness", label: "Health & Wellness", description: "Fitness, medical, wellbeing" },
  { id: "finance", label: "Finance", description: "Fintech, banking, insurance" },
  { id: "education", label: "Education", description: "Schools, courses, edtech" },
  { id: "real_estate", label: "Real Estate", description: "Property, construction, interiors" },
  { id: "entertainment", label: "Entertainment", description: "Media, gaming, events" },
  { id: "nonprofit", label: "Nonprofit", description: "Charity, community, causes" },
  { id: "other", label: "Other", description: "General / mixed sector" },
];

export const BRAND_FEELINGS: {
  id: BrandFeeling;
  label: string;
  description: string;
}[] = [
  { id: "premium", label: "Premium", description: "Refined, high-end, polished" },
  { id: "playful", label: "Playful", description: "Fun, energetic, approachable" },
  { id: "minimal", label: "Minimal", description: "Clean, simple, spacious" },
  { id: "bold", label: "Bold", description: "Strong, confident, loud" },
  { id: "friendly", label: "Friendly", description: "Warm, human, welcoming" },
  { id: "luxury", label: "Luxury", description: "Elegant, exclusive, aspirational" },
  { id: "innovative", label: "Innovative", description: "Future-forward, cutting-edge" },
  { id: "trustworthy", label: "Trustworthy", description: "Stable, credible, calm" },
];

export const COLOR_PRESETS: {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  accent?: string;
}[] = [
  {
    id: "identiq",
    label: "Identiq Purple",
    primary: "#C46DFD",
    secondary: "#111827",
    accent: "#E879F9",
  },
  {
    id: "ocean",
    label: "Ocean Tech",
    primary: "#2563EB",
    secondary: "#0F172A",
    accent: "#38BDF8",
  },
  {
    id: "sunset",
    label: "Sunset Warm",
    primary: "#F97316",
    secondary: "#431407",
    accent: "#FCD34D",
  },
  {
    id: "forest",
    label: "Forest Calm",
    primary: "#059669",
    secondary: "#14532D",
    accent: "#6EE7B7",
  },
  {
    id: "luxury",
    label: "Luxury Gold",
    primary: "#D4AF37",
    secondary: "#1C1917",
    accent: "#F5E6C8",
  },
  {
    id: "mono",
    label: "Modern Mono",
    primary: "#18181B",
    secondary: "#71717A",
    accent: "#A1A1AA",
  },
];

export function createEmptyDraft(): BrandProjectDraft {
  return {
    id: `draft_${crypto.randomUUID().slice(0, 8)}`,
    step: 0,
    name: "",
    domain: "",
    tagline: "",
    description: "",
    sector: "",
    feelings: [],
    colors: { primary: "#C46DFD", secondary: "#111827", accent: "#E879F9" },
    typography: {
      hasCustomFont: false,
      fontPrimary: "",
      fontSecondary: "",
      fontFamily: "",
      fontNotes: "",
    },
    audience: "",
    styleNotes: "",
    attachments: [],
    assetSelections: getDefaultAssetSelections(),
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
}
