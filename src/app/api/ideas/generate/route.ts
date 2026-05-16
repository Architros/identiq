import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
} from "ai";
import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";
import { generationRequestSchema } from "@/lib/generation/generate-request-schema";
import { buildComposedPrompt } from "@/lib/generation/build-prompt";
import { streamOrchestratePrompt } from "@/lib/ai/llm/stream-orchestrate-prompt";
import { generateBrandImage } from "@/lib/ai/image/generate-brand-image";
import { mapGenerationSettings } from "@/lib/ai/image/map-generation-settings";
import { getActiveImageModelId } from "@/lib/ai/providers";
import { isR2Configured } from "@/lib/storage/r2-config";
import { uploadIdeasGeneratedImage } from "@/lib/storage/r2";

export const maxDuration = 120;

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = json as {
    messages?: IdentiqUIMessage[];
    brandId?: string;
    brandMemory?: unknown;
    brandAssets?: unknown;
    presets?: unknown;
    userPrompt?: string;
    imageAssist?: boolean;
    referenceImageCount?: number;
    settings?: unknown;
  };

  const parsed = generationRequestSchema.safeParse({
    brandId: body.brandId,
    brandMemory: body.brandMemory,
    brandAssets: body.brandAssets,
    presets: body.presets,
    userPrompt: body.userPrompt ?? "",
    imageAssist: body.imageAssist ?? true,
    referenceImageCount: body.referenceImageCount ?? 0,
    settings: body.settings,
  });

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid generation request" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const gen = parsed.data;

  if (gen.presets.length === 0 && !gen.userPrompt.trim()) {
    return new Response(
      JSON.stringify({ error: "Select a preset or enter a prompt" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const messages = body.messages ?? [];
  const abortSignal = request.signal;

  const stream = createUIMessageStream<IdentiqUIMessage>({
    originalMessages: messages,
    execute: async ({ writer }) => {
      const statusId = "generation-status";

      writer.write({
        type: "data-generation-status",
        id: statusId,
        data: { phase: "orchestrating" },
      });

      const basePrompt = buildComposedPrompt({
        brandMemory: gen.brandMemory,
        brandAssets: gen.brandAssets,
        presets: gen.presets,
        userPrompt: gen.userPrompt,
        imageAssist: gen.imageAssist,
      });

      let finalPrompt = basePrompt;

      try {
        const orchestration = streamOrchestratePrompt({
          basePrompt,
          brandMemory: gen.brandMemory,
          brandAssets: gen.brandAssets,
          presets: gen.presets,
          userPrompt: gen.userPrompt,
          imageAssist: gen.imageAssist,
          abortSignal,
        });

        writer.merge(orchestration.toUIMessageStream());

        const text = await orchestration.text;
        const trimmed = text.trim();
        if (trimmed) {
          finalPrompt = trimmed;
        }
      } catch (orchestrateError) {
        if (abortSignal.aborted) {
          writer.write({
            type: "data-generation-status",
            id: statusId,
            data: { phase: "stopped" },
          });
          return;
        }

        console.warn(
          "[ideas/generate] orchestration failed, using base prompt:",
          orchestrateError,
        );

        const fallbackId = generateId();
        writer.write({ type: "text-start", id: fallbackId });
        writer.write({
          type: "text-delta",
          id: fallbackId,
          delta:
            "Using your brand context directly (orchestration unavailable).\n\n",
        });
        writer.write({
          type: "text-delta",
          id: fallbackId,
          delta: basePrompt,
        });
        writer.write({ type: "text-end", id: fallbackId });
      }

      if (abortSignal.aborted) {
        writer.write({
          type: "data-generation-status",
          id: statusId,
          data: { phase: "stopped" },
        });
        return;
      }

      const mapped = mapGenerationSettings(gen.settings);

      writer.write({
        type: "data-generation-status",
        id: statusId,
        data: {
          phase: "generating-image",
          aspectRatio: mapped.aspectRatio,
          quantity: mapped.quantity,
          imageModel: getActiveImageModelId(),
        },
      });

      try {
        const { images, modelId } = await generateBrandImage({
          prompt: finalPrompt,
          settings: gen.settings,
          abortSignal,
        });

        if (abortSignal.aborted) {
          writer.write({
            type: "data-generation-status",
            id: statusId,
            data: { phase: "stopped" },
          });
          return;
        }

        const jobId = `job_${crypto.randomUUID().slice(0, 8)}`;

        const storedImages = await Promise.all(
          images.map(async (img, index) => {
            if (!isR2Configured()) {
              return { base64: img.base64, mediaType: img.mediaType };
            }
            const id =
              images.length > 1 ? `${jobId}_${index}` : jobId;
            const uploaded = await uploadIdeasGeneratedImage({
              brandId: gen.brandId,
              jobId: id,
              base64: img.base64,
              mediaType: img.mediaType,
            });
            return {
              mediaType: img.mediaType,
              url: uploaded.url,
              storageKey: uploaded.key,
            };
          }),
        );

        writer.write({
          type: "data-image-result",
          id: jobId,
          data: {
            jobId,
            images: storedImages,
            model: modelId,
            composedPrompt: finalPrompt,
            userPrompt: gen.userPrompt,
            aspectRatio: gen.settings.aspectRatio,
            presetTitles: gen.presets.map((p) => p.title),
          },
        });

        writer.write({
          type: "data-generation-status",
          id: statusId,
          data: { phase: "done" },
        });
      } catch (imageError) {
        if (abortSignal.aborted) {
          writer.write({
            type: "data-generation-status",
            id: statusId,
            data: { phase: "stopped" },
          });
          return;
        }

        const message =
          imageError instanceof Error
            ? imageError.message
            : "Image generation failed";

        writer.write({
          type: "data-generation-status",
          id: statusId,
          data: { phase: "error", errorMessage: message },
        });

        writer.write({ type: "error", errorText: message });
      }
    },
    onError: (error) =>
      error instanceof Error ? error.message : "Generation failed",
  });

  return createUIMessageStreamResponse({ stream });
}
