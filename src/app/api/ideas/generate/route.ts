import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
} from "ai";
import {
  deductTokensOrResponse,
  requireApiUserResponse,
} from "@/lib/auth/guard-api";
import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";
import { calculateGenerationTokenCost } from "@/lib/generation/token-cost";
import { generationRequestSchema } from "@/lib/generation/generate-request-schema";
import { buildComposedPrompt } from "@/lib/generation/build-prompt";
import { streamOrchestratePrompt } from "@/lib/ai/llm/stream-orchestrate-prompt";
import { generateBrandImage } from "@/lib/ai/image/generate-brand-image";
import { getActiveImageModelId } from "@/lib/ai/providers";
import { isR2Configured } from "@/lib/storage/r2-config";
import { uploadIdeasGeneratedImage } from "@/lib/storage/r2";
import { getBrandForUser } from "@/lib/db/repositories/brands";
import { listReferencesForBrand } from "@/lib/db/repositories/assets";
import { mergeGenerationReferenceUrls } from "@/lib/generation/merge-reference-urls";
import type { AspectRatio } from "@/lib/generation/presets";
import { toUserFacingGenerationError } from "@/lib/errors/user-facing";
import { userOwnsIdeasChat } from "@/lib/db/repositories/ideas-chats";

export const maxDuration = 120;

type PresetGenerationRun = {
  presetId?: string;
  presetTitle?: string;
  aspectRatio: AspectRatio;
};

function buildGenerationRuns(
  presets: { id: string; title: string; aspectRatio: string }[],
  fallbackAspectRatio: AspectRatio,
): PresetGenerationRun[] {
  if (presets.length === 0) {
    return [{ aspectRatio: fallbackAspectRatio }];
  }
  return presets.map((p) => ({
    presetId: p.id,
    presetTitle: p.title,
    aspectRatio: p.aspectRatio as AspectRatio,
  }));
}

export async function POST(request: Request) {
  const auth = await requireApiUserResponse("brand:generate");
  if ("response" in auth) return auth.response;
  const user = auth.user;

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
    chatId: (body as { chatId?: string }).chatId,
    brandId: body.brandId,
    brandDisplayName: (body as { brandDisplayName?: string }).brandDisplayName,
    brandMemory: body.brandMemory,
    brandAssets: body.brandAssets,
    presets: body.presets,
    userPrompt: body.userPrompt ?? "",
    imageAssist: body.imageAssist ?? true,
    referenceImageCount: body.referenceImageCount ?? 0,
    composerReferenceImages: (body as { composerReferenceImages?: unknown })
      .composerReferenceImages,
    libraryTemplateId: (body as { libraryTemplateId?: string }).libraryTemplateId,
    settings: body.settings,
  });

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid generation request" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const gen = parsed.data;

  if (gen.chatId) {
    const ownsChat = await userOwnsIdeasChat(user.id, gen.chatId);
    if (!ownsChat) {
      return new Response(JSON.stringify({ error: "Chat not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const kit = await getBrandForUser(user.id, gen.brandId);
  const brandDisplayName = gen.brandDisplayName ?? kit?.displayName ?? "Brand";

  const refs = await listReferencesForBrand(user.id, gen.brandId);
  const logoUrl = kit?.assets.find((a) => a.type.startsWith("logo_"))?.url;
  const mergedRefs = mergeGenerationReferenceUrls({
    composerReferenceImages: gen.composerReferenceImages,
    libraryTemplateId: gen.libraryTemplateId,
    dbReferences: refs,
    logoUrl,
  });
  const referenceImageUrls = mergedRefs.urls;
  const isLibraryRemix = mergedRefs.isLibraryRemix;
  const hasLogoAttachment = Boolean(
    logoUrl && referenceImageUrls.includes(logoUrl),
  );

  if (
    gen.presets.length === 0 &&
    !gen.userPrompt.trim() &&
    !gen.libraryTemplateId
  ) {
    return new Response(
      JSON.stringify({ error: "Select a preset or enter a prompt" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const messages = body.messages ?? [];
  const abortSignal = request.signal;
  const generationId = generateId();
  const runs = buildGenerationRuns(
    gen.presets,
    gen.settings.aspectRatio as AspectRatio,
  );

  const tokenCost = calculateGenerationTokenCost({
    presetCount: runs.length,
    hasPrompt: Boolean(gen.userPrompt.trim()),
    isLibraryRemix,
    quantity: gen.settings.quantity,
    resolution: gen.settings.resolution,
    referenceImageCount: gen.referenceImageCount,
  });

  if (tokenCost > 0) {
    const deduct = await deductTokensOrResponse({
      userId: user.id,
      amount: tokenCost,
      referenceType: "ideas_generate",
      referenceId: generationId,
      idempotencyKey: `ideas_${generationId}`,
    });
    if (deduct) return deduct;
  }

  const stream = createUIMessageStream<IdentiqUIMessage>({
    originalMessages: messages,
    execute: async ({ writer }) => {
      const statusId = "generation-status";

      writer.write({
        type: "data-generation-status",
        id: statusId,
        data: {
          phase: isLibraryRemix ? "composing-prompt" : "orchestrating",
        },
      });

      const basePrompt = buildComposedPrompt({
        brandDisplayName,
        brandMemory: gen.brandMemory,
        brandAssets: gen.brandAssets,
        presets: gen.presets,
        userPrompt: gen.userPrompt,
        imageAssist: gen.imageAssist,
        referenceImageUrls,
        referenceImageNames: mergedRefs.names,
        mode: isLibraryRemix ? "library-remix" : "default",
        hasLogoAttachment,
        description: kit?.description,
        sector: kit?.sector,
        feelings: kit?.feelings,
      });

      let finalPrompt = basePrompt;

      if (isLibraryRemix) {
        writer.write({
          type: "data-generation-status",
          id: statusId,
          data: { phase: "composing-prompt" },
        });
        const promptId = generateId();
        writer.write({ type: "text-start", id: promptId });
        writer.write({
          type: "text-delta",
          id: promptId,
          delta: basePrompt,
        });
        writer.write({ type: "text-end", id: promptId });
      } else {
        try {
          const orchestration = streamOrchestratePrompt({
            basePrompt,
            brandMemory: gen.brandMemory,
            brandAssets: gen.brandAssets,
            presets: gen.presets,
            userPrompt: gen.userPrompt,
            imageAssist: gen.imageAssist,
            referenceImageUrls,
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
      }

      if (abortSignal.aborted) {
        writer.write({
          type: "data-generation-status",
          id: statusId,
          data: { phase: "stopped" },
        });
        return;
      }

      try {
        for (const run of runs) {
          if (abortSignal.aborted) break;

          writer.write({
            type: "data-generation-status",
            id: statusId,
            data: {
              phase: "generating-image",
              aspectRatio: run.aspectRatio,
              quantity: gen.settings.quantity,
              imageModel: getActiveImageModelId(),
              presetId: run.presetId,
              presetTitle: run.presetTitle,
            },
          });

          const { images, modelId, output } = await generateBrandImage({
            prompt: finalPrompt,
            settings: {
              aspectRatio: run.aspectRatio,
              resolution: gen.settings.resolution,
              quantity: gen.settings.quantity,
              presetId: run.presetId,
            },
            referenceImageUrls,
            abortSignal,
          });

          if (abortSignal.aborted) break;

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
            type: "data-generation-status",
            id: statusId,
            data: {
              phase: "generating-image",
              aspectRatio: output.aspectRatio,
              quantity: gen.settings.quantity,
              imageModel: modelId,
              presetId: run.presetId,
              presetTitle: run.presetTitle,
              displayDimensions: output.displayDimensions,
              size: output.size,
            },
          });

          writer.write({
            type: "data-image-result",
            id: jobId,
            data: {
              jobId,
              images: storedImages,
              model: modelId,
              composedPrompt: finalPrompt,
              userPrompt: gen.userPrompt,
              aspectRatio: output.aspectRatio,
              presetId: run.presetId,
              presetTitle: run.presetTitle,
              presetTitles: run.presetTitle
                ? [run.presetTitle]
                : gen.presets.map((p) => p.title),
              displayDimensions: output.displayDimensions,
              size: output.size,
              completedAt: new Date().toISOString(),
            },
          });
        }

        if (abortSignal.aborted) {
          writer.write({
            type: "data-generation-status",
            id: statusId,
            data: { phase: "stopped" },
          });
          return;
        }

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

        const raw =
          imageError instanceof Error
            ? imageError.message
            : "Image generation failed";
        console.error("[ideas/generate] image generation failed", {
          message: raw,
          modelId: getActiveImageModelId(),
          referenceCount: referenceImageUrls.length,
          libraryTemplateId: gen.libraryTemplateId,
          isLibraryRemix,
          promptLength: finalPrompt.length,
        });
        const { message, supportHint } = toUserFacingGenerationError(raw);
        const userMessage = supportHint
          ? `${message} ${supportHint}`
          : message;

        writer.write({
          type: "data-generation-status",
          id: statusId,
          data: { phase: "error", errorMessage: userMessage },
        });

        writer.write({ type: "error", errorText: userMessage });
      }
    },
    onError: (error) =>
      error instanceof Error ? error.message : "Generation failed",
  });

  return createUIMessageStreamResponse({ stream });
}
