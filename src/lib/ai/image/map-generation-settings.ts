import type { AspectRatio, Resolution } from "@/lib/generation/presets";
import { isAiDevMode } from "@/lib/ai/providers";

export type GenerationSettingsInput = {
  aspectRatio: AspectRatio;
  resolution: Resolution;
  quantity: number;
};

export type MappedImageSettings = {
  aspectRatio: AspectRatio;
  quantity: number;
  effectiveResolution: Resolution;
};

export function mapGenerationSettings(
  settings: GenerationSettingsInput,
): MappedImageSettings {
  const isDev = isAiDevMode();

  let effectiveResolution = settings.resolution;
  let quantity = settings.quantity;

  if (isDev) {
    quantity = Math.min(quantity, 1);
    if (settings.resolution === "2K") {
      effectiveResolution = "1K";
    }
  }

  return {
    aspectRatio: settings.aspectRatio,
    quantity,
    effectiveResolution,
  };
}
