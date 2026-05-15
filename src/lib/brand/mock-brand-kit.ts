import type { BrandKit } from "@/lib/brand/types";

export const mockBrandKit: BrandKit = {
  id: "brand_bkreative",
  domain: "bkreative.com",
  displayName: "B KREATIVE",
  memory: {
    brand_style: "minimal creative agency",
    primary_color: "#C46DFD",
    secondary_color: "#111827",
    font_pairing: "Instrument Serif + Geist",
    visual_language: "soft gradients, rounded cards",
    tone: "premium playful",
  },
  assets: [
    {
      type: "logo_primary",
      url: "/brand/logo-primary.svg",
      label: "Primary logo",
    },
    {
      type: "logo_icon",
      url: "/brand/logo-icon.svg",
      label: "Icon mark",
    },
    {
      type: "logo_secondary",
      url: "/brand/logo-primary.svg",
      label: "Secondary logo",
    },
    {
      type: "logo_monochrome",
      url: "/brand/logo-primary.svg",
      label: "Monochrome logo",
    },
    {
      type: "logo_white",
      url: "/brand/logo-icon.svg",
      label: "White logo variant",
    },
  ],
};
