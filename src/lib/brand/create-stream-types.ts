import type { BrandMemory } from "@/lib/brand/types";
import type { WizardTypography } from "@/lib/brand/brand-memory-schema";

export type CreateStreamPhase =
  | "orchestrating"
  | "planning"
  | "generating"
  | "done"
  | "error"
  | "stopped";

export type CreateStatusData = {
  phase: CreateStreamPhase;
  message?: string;
};

export type AssetProgressStatus =
  | "queued"
  | "generating"
  | "uploading"
  | "saved"
  | "error";

export type AssetProgressData = {
  index: number;
  itemId: string;
  catalogId: string;
  title: string;
  variantLabel?: string;
  aspectRatio: string;
  category: "logo" | "social" | "advertising";
  status: AssetProgressStatus;
  errorMessage?: string;
};

export type AssetCompleteData = {
  index: number;
  itemId: string;
  title: string;
  variantLabel?: string;
  composedPrompt?: string;
  /** Public HTTPS URL when stored on R2 */
  url?: string;
  /** Legacy inline preview when R2 is unavailable */
  base64?: string;
  mediaType: string;
  aspectRatio: string;
  storageKey?: string;
};

export type BrandMemoryStreamData = {
  memory: BrandMemory;
  displayName: string;
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
  };
  typography?: WizardTypography;
};

export type CreateCompleteData = {
  brandId: string;
  domain: string;
  displayName: string;
  memory: BrandMemory;
  imageModel: string;
  uploadedLogoUrl?: string;
};

export type IdentiqCreateUIDataTypes = {
  "create-status": CreateStatusData;
  "brand-memory": BrandMemoryStreamData;
  "asset-progress": AssetProgressData;
  "asset-complete": AssetCompleteData;
  "create-complete": CreateCompleteData;
};
