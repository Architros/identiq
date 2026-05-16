import type { AssetCatalogCategory } from "@/lib/brand/asset-catalog";

export type BrandMemory = {
  brand_style: string;
  primary_color: string;
  secondary_color: string;
  font_pairing: string;
  visual_language: string;
  tone: string;
};

export type BrandAssetType =
  | "logo_primary"
  | "logo_secondary"
  | "logo_icon"
  | "logo_monochrome"
  | "logo_white";

export type BrandAsset = {
  type: BrandAssetType;
  url: string;
  label: string;
};

export type BrandReferenceSource = "wizard" | "ideas";

export type BrandReference = {
  id: string;
  brandId: string;
  name: string;
  type: string;
  url: string;
  source: BrandReferenceSource;
  createdAt: string;
};

export type BrandKit = {
  id: string;
  domain: string;
  displayName: string;
  memory: BrandMemory;
  assets: BrandAsset[];
  references?: BrandReference[];
  description?: string;
  tagline?: string;
  sector?: string;
  feelings?: string[];
};

export type GeneratedAssetSource = "starter-pack" | "ideas";

export type GeneratedBrandAsset = {
  id: string;
  brandId: string;
  jobId: string;
  presetId?: string;
  presetTitle?: string;
  prompt: string;
  composedPrompt: string;
  previewUrl: string;
  mediaType: string;
  aspectRatio: string;
  model: string;
  createdAt: string;
  status: "pending" | "saved" | "discarded";
  source?: GeneratedAssetSource;
  category?: AssetCatalogCategory;
  catalogId?: string;
};
