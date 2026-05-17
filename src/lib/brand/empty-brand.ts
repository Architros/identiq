import type { BrandSummary } from "@/lib/brand/brands";
import type { BrandKit } from "@/lib/brand/types";

export const NO_BRAND_ID = "";

export const emptyBrandSummary: BrandSummary = {
  id: NO_BRAND_ID,
  domain: "No brand yet",
  displayName: "Create a brand",
  avatar: { bg: "#E5E7EB", color: "#6B7280", letter: "+" },
  imageCount: 0,
  updatedAt: "",
};

export const emptyBrandKit: BrandKit = {
  id: NO_BRAND_ID,
  domain: "",
  displayName: "Create a brand",
  memory: {
    brand_style: "",
    primary_color: "#C46DFD",
    secondary_color: "#111827",
    font_pairing: "",
    visual_language: "",
    tone: "",
  },
  assets: [],
};
