import type { UIMessage } from "ai";

export type GenerationPhase =
  | "orchestrating"
  | "generating-image"
  | "done"
  | "error"
  | "stopped";

export type GenerationStatusData = {
  phase: GenerationPhase;
  aspectRatio?: string;
  quantity?: number;
  imageModel?: string;
  presetId?: string;
  presetTitle?: string;
  displayDimensions?: string;
  size?: string;
  errorMessage?: string;
};

export type StreamImageResult = {
  base64?: string;
  mediaType: string;
  url?: string;
  storageKey?: string;
};

export type ImageResultData = {
  jobId: string;
  images: StreamImageResult[];
  model: string;
  composedPrompt: string;
  userPrompt: string;
  aspectRatio: string;
  presetId?: string;
  presetTitle?: string;
  presetTitles: string[];
  displayDimensions?: string;
  size?: string;
  completedAt?: string;
};

export type IdentiqMessageMetadata = {
  presetTitles?: string[];
  presetIds?: string[];
};

export type IdentiqUIDataTypes = {
  "generation-status": GenerationStatusData;
  "image-result": ImageResultData;
};

export type IdentiqUIMessage = UIMessage<
  IdentiqMessageMetadata,
  IdentiqUIDataTypes
>;
