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

export type BrandKit = {
  id: string;
  domain: string;
  displayName: string;
  memory: BrandMemory;
  assets: BrandAsset[];
};
