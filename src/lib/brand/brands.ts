import type { BrandKit } from "@/lib/brand/types";
import { mockBrandKit } from "@/lib/brand/mock-brand-kit";

export type BrandAvatarStyle = {
  bg: string;
  color: string;
  letter?: string;
  icon?: "triangle";
};

export type BrandSummary = {
  id: string;
  domain: string;
  displayName: string;
  avatar: BrandAvatarStyle;
  imageCount: number;
  updatedAt: string;
};

export const autonomiBrandKit: BrandKit = {
  id: "brand_autonomi",
  domain: "autonomi.run",
  displayName: "Autonomi",
  memory: {
    brand_style: "technical minimal",
    primary_color: "#111827",
    secondary_color: "#6B7280",
    font_pairing: "Geist + Geist",
    visual_language: "sharp geometry, high contrast",
    tone: "precise innovative",
  },
  assets: [
    {
      type: "logo_primary",
      url: "/brand/autonomi-icon.svg",
      label: "Primary logo",
    },
  ],
};

export const brandKitsById: Record<string, BrandKit> = {
  [mockBrandKit.id]: mockBrandKit,
  [autonomiBrandKit.id]: autonomiBrandKit,
};

export const mockBrands: BrandSummary[] = [
  {
    id: "brand_autonomi",
    domain: "autonomi.run",
    displayName: "Autonomi",
    avatar: { bg: "#111827", color: "#ffffff", icon: "triangle" },
    imageCount: 2,
    updatedAt: "Feb 13, 2026",
  },
  {
    id: "brand_bkreative",
    domain: "bkreative.com",
    displayName: "B KREATIVE",
    avatar: { bg: "#DC2626", color: "#ffffff", letter: "B" },
    imageCount: 1,
    updatedAt: "Feb 13, 2026",
  },
];

export function getBrandKitById(id: string): BrandKit | undefined {
  return brandKitsById[id];
}
