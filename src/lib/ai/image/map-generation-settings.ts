import type { AspectRatio, Resolution } from "@/lib/generation/presets";
import { isAiDevMode, getActiveImageModelId } from "@/lib/ai/providers";
import {
  resolveImageOutput,
  type ResolvedImageOutput,
} from "@/lib/ai/image/resolve-image-output";

export type GenerationSettingsInput = {
  aspectRatio: AspectRatio;
  resolution: Resolution;
  quantity: number;
  presetId?: string;
};

export type MappedImageSettings = ResolvedImageOutput & {
  quantity: number;
};

export function mapGenerationSettings(
  settings: GenerationSettingsInput,
): MappedImageSettings {
  const isDev = isAiDevMode();
  const modelId = getActiveImageModelId();

  let effectiveResolution = settings.resolution;
  let quantity = settings.quantity;

  if (isDev) {
    quantity = Math.min(quantity, 1);
    if (settings.resolution === "2K") {
      effectiveResolution = "1K";
    }
  }

  const resolved = resolveImageOutput({
    aspectRatio: settings.aspectRatio,
    resolution: effectiveResolution,
    presetId: settings.presetId,
    modelId,
  });

  return {
    ...resolved,
    quantity,
  };
}
