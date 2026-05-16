import type { BrandMemory } from "@/lib/brand/types";

export type CreateStreamPhase =
  | "orchestrating"
  | "generating"
  | "done"
  | "error"
  | "stopped";

export type CreateStatusData = {
  phase: CreateStreamPhase;
  message?: string;
};

export type AssetProgressData = {
  index: number;
  itemId: string;
  title: string;
  status: "pending" | "generating" | "complete" | "error";
  errorMessage?: string;
};

export type AssetCompleteData = {
  index: number;
  itemId: string;
  title: string;
  base64: string;
  mediaType: string;
  aspectRatio: string;
};

export type CreateCompleteData = {
  brandId: string;
  domain: string;
  displayName: string;
  memory: BrandMemory;
  imageModel: string;
};

export type IdentiqCreateUIDataTypes = {
  "create-status": CreateStatusData;
  "asset-progress": AssetProgressData;
  "asset-complete": AssetCompleteData;
  "create-complete": CreateCompleteData;
};
