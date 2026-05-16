import {
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import { generateBrandImage } from "@/lib/ai/image/generate-brand-image";
import { getActiveImageModelId } from "@/lib/ai/providers";
import { orchestrateBrandMemoryFromWizard } from "@/lib/brand/orchestrate-from-wizard";
import { buildStarterItemPrompt } from "@/lib/brand/build-starter-prompt";
import {
  expandAssetSelections,
  normalizeAssetSelections,
} from "@/lib/brand/asset-catalog";
import { catalogItemToStarterItem } from "@/lib/brand/starter-pack";
import { wizardOrchestrateInputSchema } from "@/lib/brand/brand-memory-schema";
import type { BrandMemory } from "@/lib/brand/types";
import type { AspectRatio } from "@/lib/generation/presets";

export const maxDuration = 300;

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const parsed = wizardOrchestrateInputSchema.safeParse(json);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid brand input" }), {
      status: 400,
    });
  }

  const input = parsed.data;
  const selections = normalizeAssetSelections(input.assetSelections);
  const jobs = expandAssetSelections(selections);

  if (jobs.length === 0) {
    return new Response(
      JSON.stringify({ error: "Select at least one asset to generate" }),
      { status: 400 },
    );
  }

  const abortSignal = request.signal;
  const brandId = `brand_${crypto.randomUUID().slice(0, 8)}`;
  const domain =
    input.domain?.trim() ||
    `${input.name.toLowerCase().replace(/\s+/g, "")}.com`;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const statusId = "create-status";

      writer.write({
        type: "data-create-status",
        id: statusId,
        data: {
          phase: "orchestrating",
          message: "Building your brand system…",
        },
      });

      let memory: BrandMemory;

      try {
        memory = await orchestrateBrandMemoryFromWizard(input, abortSignal);
        memory = {
          ...memory,
          primary_color: input.colors.primary,
          secondary_color: input.colors.secondary,
        };
      } catch (error) {
        if (abortSignal.aborted) {
          writer.write({
            type: "data-create-status",
            id: statusId,
            data: { phase: "stopped" },
          });
          return;
        }
        const message =
          error instanceof Error ? error.message : "Orchestration failed";
        writer.write({
          type: "data-create-status",
          id: statusId,
          data: { phase: "error", message },
        });
        writer.write({ type: "error", errorText: message });
        return;
      }

      if (abortSignal.aborted) return;

      writer.write({
        type: "data-create-status",
        id: statusId,
        data: {
          phase: "generating",
          message: `Generating ${jobs.length} asset${jobs.length === 1 ? "" : "s"}…`,
        },
      });

      for (let index = 0; index < jobs.length; index++) {
        if (abortSignal.aborted) {
          writer.write({
            type: "data-create-status",
            id: statusId,
            data: { phase: "stopped" },
          });
          return;
        }

        const job = jobs[index];
        const starterItem = catalogItemToStarterItem(job.item);
        const title =
          job.instance > 0
            ? `${job.item.title} (${job.instance + 1})`
            : job.item.title;

        writer.write({
          type: "data-asset-progress",
          id: `asset-${job.jobKey}`,
          data: {
            index,
            itemId: job.jobKey,
            title,
            status: "generating",
          },
        });

        try {
          const prompt = buildStarterItemPrompt(starterItem, memory, input);
          const { images } = await generateBrandImage({
            prompt,
            settings: {
              aspectRatio: job.item.aspectRatio as AspectRatio,
              resolution: "1K",
              quantity: 1,
            },
            abortSignal,
          });

          const first = images[0];
          if (!first) {
            throw new Error("No image returned");
          }

          writer.write({
            type: "data-asset-complete",
            id: `asset-done-${job.jobKey}`,
            data: {
              index,
              itemId: job.jobKey,
              title,
              base64: first.base64,
              mediaType: first.mediaType,
              aspectRatio: job.item.aspectRatio,
            },
          });

          writer.write({
            type: "data-asset-progress",
            id: `asset-${job.jobKey}`,
            data: {
              index,
              itemId: job.jobKey,
              title,
              status: "complete",
            },
          });
        } catch (itemError) {
          const message =
            itemError instanceof Error
              ? itemError.message
              : "Generation failed";
          writer.write({
            type: "data-asset-progress",
            id: `asset-${job.jobKey}`,
            data: {
              index,
              itemId: job.jobKey,
              title,
              status: "error",
              errorMessage: message,
            },
          });
        }
      }

      writer.write({
        type: "data-create-complete",
        id: "create-complete",
        data: {
          brandId,
          domain,
          displayName: input.name,
          memory,
          imageModel: getActiveImageModelId(),
        },
      });

      writer.write({
        type: "data-create-status",
        id: statusId,
        data: { phase: "done", message: "Brand created" },
      });
    },
    onError: (error) =>
      error instanceof Error ? error.message : "Brand creation failed",
  });

  return createUIMessageStreamResponse({ stream });
}
