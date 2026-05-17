import { generateImage } from "ai";
import { getActiveImageModelId, getImageModel } from "@/lib/ai/providers";
import { loadReferenceImagesFromUrls } from "@/lib/ai/image/load-reference-images";
import type { AspectRatio } from "@/lib/generation/presets";
import {
  mapGenerationSettings,
  type GenerationSettingsInput,
} from "@/lib/ai/image/map-generation-settings";
import { shouldPassGptSizeToProvider } from "@/lib/ai/image/resolve-image-output";

export type GeneratedImage = {
  base64: string;
  mediaType: string;
};

export type GenerateBrandImageResult = {
  images: GeneratedImage[];
  modelId: string;
  output: ReturnType<typeof mapGenerationSettings>;
};

export async function generateBrandImage(input: {
  prompt: string;
  settings: GenerationSettingsInput;
  abortSignal?: AbortSignal;
  referenceImageUrls?: string[];
}): Promise<GenerateBrandImageResult> {
  const mapped = mapGenerationSettings(input.settings);
  const model = getImageModel();
  const modelId = getActiveImageModelId();
  const useGptSize = shouldPassGptSizeToProvider(modelId);

  const referenceBuffers = await loadReferenceImagesFromUrls(
    input.referenceImageUrls ?? [],
  );

  const promptPayload =
    referenceBuffers.length > 0
      ? ({
          text: input.prompt,
          images: referenceBuffers,
        } as const)
      : input.prompt;

  const { images } = await generateImage({
    model,
    prompt: promptPayload,
    aspectRatio: mapped.aspectRatio as AspectRatio,
    ...(useGptSize ? { size: mapped.size } : {}),
    n: mapped.quantity,
    abortSignal: input.abortSignal,
    providerOptions: {
      openrouter: {
        image_config: {
          aspect_ratio: mapped.aspectRatio,
          image_size: mapped.resolution,
        },
        quality: mapped.quality,
      },
    },
  });

  const results: GeneratedImage[] = images.map((img) => ({
    base64: img.base64,
    mediaType: img.mediaType ?? "image/png",
  }));

  if (results.length === 0) {
    throw new Error("Image model returned no images");
  }

  return { images: results, modelId, output: mapped };
}
