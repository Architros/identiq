import { isDataUIPart } from "ai";
import type { UIMessage } from "ai";
import type {
  AssetCompleteData,
  AssetProgressData,
  BrandMemoryStreamData,
  CreateCompleteData,
  CreateStatusData,
} from "@/lib/brand/create-stream-types";
import {
  expandAssetSelections,
  getEffectiveAssetSelections,
  normalizeAssetSelections,
} from "@/lib/brand/asset-catalog";
import type { AspectRatio } from "@/lib/generation/presets";

export type ParsedCreateStream = {
  status: CreateStatusData | null;
  brandMemory: BrandMemoryStreamData | null;
  assetProgress: Map<string, AssetProgressData>;
  assetResults: Map<string, AssetCompleteData>;
  complete: CreateCompleteData | null;
  errorText: string | null;
};

export function parseCreateMessage(message: UIMessage): ParsedCreateStream {
  const assetProgress = new Map<string, AssetProgressData>();
  const assetResults = new Map<string, AssetCompleteData>();
  let status: CreateStatusData | null = null;
  let brandMemory: BrandMemoryStreamData | null = null;
  let complete: CreateCompleteData | null = null;
  let errorText: string | null = null;

  for (const part of message.parts ?? []) {
    if (isDataUIPart(part)) {
      if (part.type === "data-create-status") {
        status = part.data as CreateStatusData;
        if (status.phase === "error") {
          errorText = status.message ?? "Brand creation failed";
        }
      } else if (part.type === "data-brand-memory") {
        brandMemory = part.data as BrandMemoryStreamData;
      } else if (part.type === "data-asset-progress") {
        const data = part.data as AssetProgressData;
        assetProgress.set(data.itemId, data);
      } else if (part.type === "data-asset-complete") {
        const data = part.data as AssetCompleteData;
        assetResults.set(data.itemId, data);
      } else if (part.type === "data-create-complete") {
        complete = part.data as CreateCompleteData;
      }
    }
  }

  return { status, brandMemory, assetProgress, assetResults, complete, errorText };
}

export function buildInitialAssetProgress(
  selections: Record<string, number>,
  aspectOverrides?: Record<string, AspectRatio>,
  options?: { hasUploadedLogo?: boolean },
): AssetProgressData[] {
  const jobs = expandAssetSelections(
    getEffectiveAssetSelections(selections, options),
    aspectOverrides,
  );
  return jobs.map((job, index) => ({
    index,
    itemId: job.jobKey,
    catalogId: job.item.id,
    title:
      job.instance > 0
        ? `${job.item.title} (${job.instance + 1})`
        : job.item.title,
    aspectRatio: job.aspectRatio,
    category: job.item.category,
    status: "queued" as const,
  }));
}
