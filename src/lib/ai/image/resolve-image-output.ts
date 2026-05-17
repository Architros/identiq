import type { AspectRatio, Resolution } from "@/lib/generation/presets";
import { getPresetById } from "@/lib/generation/presets";
import {
  getImageModelFamily,
  usesGptImageSizeParams,
  type ImageModelFamily,
} from "@/lib/ai/image/image-model-capabilities";

export type ImageQuality = "low" | "medium" | "high";

export type GptImageSize = "1024x1024" | "1536x1024" | "1024x1536";

const GPT_SIZE_BY_ASPECT: Record<AspectRatio, GptImageSize> = {
  "1:1": "1024x1024",
  "9:16": "1024x1536",
  "16:9": "1536x1024",
  "4:5": "1024x1536",
  "2:3": "1024x1536",
  "21:9": "1536x1024",
};

const QUALITY_BY_RESOLUTION: Record<Resolution, ImageQuality> = {
  "1K": "medium",
  "2K": "high",
};

export type ResolvedImageOutput = {
  aspectRatio: AspectRatio;
  resolution: Resolution;
  size: GptImageSize;
  quality: ImageQuality;
  displayDimensions: string;
  platformPixelHint?: string;
  modelFamily: ImageModelFamily;
};

export type ResolveImageOutputInput = {
  aspectRatio: AspectRatio;
  resolution: Resolution;
  presetId?: string;
  modelId: string;
};

function formatDisplaySize(size: GptImageSize): string {
  const [w, h] = size.split("x");
  return `${w}×${h}`;
}

export function resolveAspectRatioForPreset(presetId?: string): AspectRatio | undefined {
  if (!presetId) return undefined;
  return getPresetById(presetId)?.aspectRatio;
}

export function resolveImageOutput(
  input: ResolveImageOutputInput,
): ResolvedImageOutput {
  const preset = input.presetId ? getPresetById(input.presetId) : undefined;
  const aspectRatio = preset?.aspectRatio ?? input.aspectRatio;
  const size = GPT_SIZE_BY_ASPECT[aspectRatio];
  const quality = QUALITY_BY_RESOLUTION[input.resolution];
  const modelFamily = getImageModelFamily(input.modelId);

  return {
    aspectRatio,
    resolution: input.resolution,
    size,
    quality,
    displayDimensions: formatDisplaySize(size),
    platformPixelHint: preset?.platformPixelHint,
    modelFamily,
  };
}

export function getResolutionOptionLabels(input: {
  aspectRatio: AspectRatio;
  presetId?: string;
}): { value: Resolution; label: string; description: string }[] {
  const preset = input.presetId ? getPresetById(input.presetId) : undefined;
  const aspectRatio = preset?.aspectRatio ?? input.aspectRatio;

  return (["1K", "2K"] as const).map((res) => {
    const resolved = resolveImageOutput({
      aspectRatio,
      resolution: res,
      presetId: input.presetId,
      modelId: "openai/gpt-image-1",
    });
    const qualityNote = res === "2K" ? " · high quality" : " · standard";
    return {
      value: res,
      label: res,
      description: `${resolved.displayDimensions}${qualityNote}`,
    };
  });
}

export function shouldPassGptSizeToProvider(modelId: string): boolean {
  return usesGptImageSizeParams(modelId);
}
