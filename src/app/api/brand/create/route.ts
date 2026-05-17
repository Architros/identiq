import {
  createUIMessageStream,
  createUIMessageStreamResponse,
} from "ai";
import {
  deductTokensOrResponse,
  requireApiUserResponse,
} from "@/lib/auth/guard-api";
import { getActiveImageModelId } from "@/lib/ai/providers";
import { orchestrateBrandMemoryFromWizard } from "@/lib/brand/orchestrate-from-wizard";
import {
  expandAssetSelections,
  normalizeAssetSelections,
} from "@/lib/brand/asset-catalog";
import { wizardOrchestrateInputSchema } from "@/lib/brand/brand-memory-schema";
import type { BrandMemory } from "@/lib/brand/types";
import {
  planStarterPackPrompts,
  plannedJobsByKey,
} from "@/lib/brand/plan-starter-pack-prompts";
import { sortStarterPackJobs } from "@/lib/brand/sort-starter-pack-jobs";
import {
  runStarterPackJobsPool,
  type LogoUrlRef,
  type StarterPackStreamWriter,
} from "@/lib/brand/run-starter-pack-job";
import type { AssetProgressData } from "@/lib/brand/create-stream-types";
import {
  ORCHESTRATION_TOKEN_COST,
  STARTER_PACK_PER_ASSET_TOKEN_COST,
} from "@/lib/brand/starter-pack";
import { deductTokens } from "@/lib/db/repositories/credits";

export const maxDuration = 300;

/** ~15 assets at 3 concurrent ≈ 5 waves; increase via background jobs if catalog grows. */
const ASSET_GENERATION_CONCURRENCY = 3;

function jobTitle(
  job: { item: { title: string }; instance: number },
): string {
  return job.instance > 0
    ? `${job.item.title} (${job.instance + 1})`
    : job.item.title;
}

export async function POST(request: Request) {
  const auth = await requireApiUserResponse("brand:create");
  if ("response" in auth) return auth.response;
  const user = auth.user;

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
  const jobs = sortStarterPackJobs(
    expandAssetSelections(selections, input.assetAspectOverrides),
  );
  const attachmentNames = input.attachmentNames ?? [];
  const attachmentUrls = input.attachmentUrls ?? [];
  const logoUrlRef: LogoUrlRef = {};

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

  const orchDeduct = await deductTokensOrResponse({
    userId: user.id,
    amount: ORCHESTRATION_TOKEN_COST,
    referenceType: "brand_orchestration",
    referenceId: brandId,
    idempotencyKey: `orch_${brandId}`,
  });
  if (orchDeduct) return orchDeduct;

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
        type: "data-brand-memory",
        id: "brand-memory",
        data: {
          memory,
          displayName: input.name,
          colors: input.colors,
          typography: input.typography,
        },
      });

      writer.write({
        type: "data-create-status",
        id: statusId,
        data: {
          phase: "planning",
          message: "Planning your asset pack…",
        },
      });

      const plan = await planStarterPackPrompts(
        input,
        memory,
        jobs,
        abortSignal,
      );
      const plannedByKey = plannedJobsByKey(plan);

      if (abortSignal.aborted) {
        writer.write({
          type: "data-create-status",
          id: statusId,
          data: { phase: "stopped" },
        });
        return;
      }

      writer.write({
        type: "data-create-status",
        id: statusId,
        data: {
          phase: "generating",
          message: `Generating ${jobs.length} asset${jobs.length === 1 ? "" : "s"}…`,
        },
      });

      for (let index = 0; index < jobs.length; index++) {
        const job = jobs[index]!;
        const planned = plannedByKey.get(job.jobKey);
        const progress: AssetProgressData = {
          index,
          itemId: job.jobKey,
          catalogId: job.item.id,
          title: jobTitle(job),
          variantLabel: planned?.variantLabel,
          aspectRatio: job.aspectRatio,
          category: job.item.category,
          status: "queued",
        };
        writer.write({
          type: "data-asset-progress",
          id: `asset-${job.jobKey}`,
          data: progress,
        });
      }

      const streamWriter: StarterPackStreamWriter = {
        writeProgress: (data) => {
          writer.write({
            type: "data-asset-progress",
            id: `asset-${data.itemId}`,
            data,
          });
        },
        writeComplete: (data) => {
          writer.write({
            type: "data-asset-complete",
            id: `asset-done-${data.itemId}`,
            data,
          });
        },
      };

      await runStarterPackJobsPool({
        jobs,
        plannedByKey,
        brandId,
        writer: streamWriter,
        abortSignal,
        concurrency: ASSET_GENERATION_CONCURRENCY,
        attachmentNames,
        attachmentUrls,
        logoUrlRef,
        onAssetGenerated: async (jobKey) => {
          await deductTokens({
            userId: user.id,
            amount: STARTER_PACK_PER_ASSET_TOKEN_COST,
            referenceType: "brand_asset",
            referenceId: `${brandId}_${jobKey}`,
            idempotencyKey: `asset_${brandId}_${jobKey}`,
          });
        },
      });

      if (abortSignal.aborted) {
        writer.write({
          type: "data-create-status",
          id: statusId,
          data: { phase: "stopped" },
        });
        return;
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
