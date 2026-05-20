import { generateBrandImage } from "@/lib/ai/image/generate-brand-image";
import type { ExpandedAssetJob } from "@/lib/brand/asset-catalog";
import { buildJobImagePrompt } from "@/lib/brand/build-job-image-prompt";
import type { BrandPromptContext } from "@/lib/brand/prompt-structure";
import type {
  AssetCompleteData,
  AssetProgressData,
} from "@/lib/brand/create-stream-types";
import type { PlannedStarterPackJob } from "@/lib/brand/plan-starter-pack-prompts";
import type { AspectRatio } from "@/lib/generation/presets";
import { isR2Configured } from "@/lib/storage/r2-config";
import { uploadGeneratedBrandImage } from "@/lib/storage/r2";

export type StarterPackStreamWriter = {
  writeProgress: (data: AssetProgressData) => void;
  writeComplete: (data: AssetCompleteData) => void;
};

export type LogoUrlRef = { current?: string };

export function isLogoStarterPackJob(job: ExpandedAssetJob): boolean {
  return job.item.id === "brand-logo" || job.item.kind === "logo";
}

function jobTitle(job: ExpandedAssetJob): string {
  return job.instance > 0
    ? `${job.item.title} (${job.instance + 1})`
    : job.item.title;
}

function baseProgress(
  job: ExpandedAssetJob,
  index: number,
  planned: PlannedStarterPackJob,
  status: AssetProgressData["status"],
): AssetProgressData {
  return {
    index,
    itemId: job.jobKey,
    catalogId: job.item.id,
    title: jobTitle(job),
    variantLabel: planned.variantLabel,
    aspectRatio: job.aspectRatio,
    category: job.item.category,
    status,
  };
}

export async function runStarterPackJob(params: {
  job: ExpandedAssetJob;
  index: number;
  planned: PlannedStarterPackJob;
  brandId: string;
  brand: BrandPromptContext;
  writer: StarterPackStreamWriter;
  abortSignal: AbortSignal;
  attachmentNames?: string[];
  attachmentUrls?: string[];
  logoUrlRef?: LogoUrlRef;
  referenceImageUrls?: string[];
  onAssetGenerated?: (jobKey: string) => void | Promise<void>;
  onJobStatusMessage?: (message: string) => void;
}): Promise<void> {
  const {
    job,
    index,
    planned,
    brandId,
    brand,
    writer,
    abortSignal,
    attachmentNames,
    attachmentUrls,
    logoUrlRef,
    referenceImageUrls,
    onAssetGenerated,
    onJobStatusMessage,
  } = params;
  const title = jobTitle(job);
  const isLogoJob = isLogoStarterPackJob(job);
  const logoUrl = logoUrlRef?.current;

  const prompt = buildJobImagePrompt(job, planned, {
    brand,
    attachmentNames,
    attachmentUrls,
    logoUrl,
  });

  onJobStatusMessage?.(`Generating ${title}…`);
  writer.writeProgress(
    baseProgress(job, index, planned, "generating"),
  );

  try {
    const refUrls = [...(referenceImageUrls ?? [])];
    if (logoUrl && !isLogoJob && !refUrls.includes(logoUrl)) {
      refUrls.push(logoUrl);
    }

    const presetId =
      job.item.kind === "preset" ? job.item.presetId ?? job.item.id : undefined;

    const { images } = await generateBrandImage({
      prompt,
      settings: {
        aspectRatio: job.aspectRatio as AspectRatio,
        resolution: "1K",
        quantity: 1,
        presetId,
      },
      abortSignal,
      referenceImageUrls: refUrls,
    });

    const first = images[0];
    if (!first) {
      throw new Error("No image returned");
    }

    writer.writeProgress(
      baseProgress(job, index, planned, "uploading"),
    );

    let url: string | undefined;
    let storageKey: string | undefined;
    let base64: string | undefined = first.base64;

    if (isR2Configured()) {
      const uploaded = await uploadGeneratedBrandImage({
        brandId,
        jobKey: job.jobKey,
        base64: first.base64,
        mediaType: first.mediaType,
      });
      url = uploaded.url;
      storageKey = uploaded.key;
      base64 = undefined;
    }

    if (
      job.item.id === "brand-logo" &&
      url &&
      logoUrlRef
    ) {
      logoUrlRef.current = url;
    }

    writer.writeComplete({
      index,
      itemId: job.jobKey,
      title,
      variantLabel: planned.variantLabel,
      composedPrompt: prompt,
      url,
      base64,
      mediaType: first.mediaType,
      aspectRatio: job.aspectRatio,
      storageKey,
    });

    writer.writeProgress(baseProgress(job, index, planned, "saved"));
    await onAssetGenerated?.(job.jobKey);
  } catch (itemError) {
    const message =
      itemError instanceof Error ? itemError.message : "Generation failed";
    writer.writeProgress({
      ...baseProgress(job, index, planned, "error"),
      errorMessage: message,
    });
  }
}

/** Run jobs with limited concurrency (default 3). */
export async function runStarterPackJobsPool(params: {
  jobs: ExpandedAssetJob[];
  plannedByKey: Map<string, PlannedStarterPackJob>;
  brandId: string;
  brand: BrandPromptContext;
  writer: StarterPackStreamWriter;
  abortSignal: AbortSignal;
  concurrency?: number;
  attachmentNames?: string[];
  attachmentUrls?: string[];
  logoUrlRef?: LogoUrlRef;
  referenceImageUrls?: string[];
  onAssetGenerated?: (jobKey: string) => void | Promise<void>;
  onJobStatusMessage?: (message: string) => void;
  /** Original indices when jobs are split across pools (key = jobKey). */
  jobIndexByKey?: Map<string, number>;
}): Promise<void> {
  const {
    jobs,
    plannedByKey,
    brandId,
    brand,
    writer,
    abortSignal,
    concurrency = 3,
    attachmentNames,
    attachmentUrls,
    logoUrlRef,
    referenceImageUrls,
    onAssetGenerated,
    onJobStatusMessage,
    jobIndexByKey,
  } = params;

  let nextIndex = 0;

  const runWorker = async () => {
    while (!abortSignal.aborted) {
      const poolIndex = nextIndex++;
      if (poolIndex >= jobs.length) break;

      const job = jobs[poolIndex]!;
      const planned = plannedByKey.get(job.jobKey);
      if (!planned) continue;

      const index = jobIndexByKey?.get(job.jobKey) ?? poolIndex;

      await runStarterPackJob({
        job,
        index,
        planned,
        brandId,
        brand,
        writer,
        abortSignal,
        attachmentNames,
        attachmentUrls,
        logoUrlRef,
        referenceImageUrls,
        onAssetGenerated,
        onJobStatusMessage,
      });
    }
  };

  const workers = Math.min(concurrency, jobs.length);
  await Promise.all(
    Array.from({ length: workers }, () => runWorker()),
  );
}

type StarterPackPoolParams = Omit<
  Parameters<typeof runStarterPackJobsPool>[0],
  "jobs" | "concurrency"
>;

/** Run logo jobs first (concurrency 1), then remaining jobs in parallel. */
export async function runStarterPackJobsLogoFirst(
  params: StarterPackPoolParams & {
    jobs: ExpandedAssetJob[];
    otherConcurrency?: number;
  },
): Promise<void> {
  const { jobs, otherConcurrency = 3, ...poolParams } = params;
  const jobIndexByKey = new Map(
    jobs.map((job, index) => [job.jobKey, index] as const),
  );
  const logoJobs = jobs.filter(isLogoStarterPackJob);
  const otherJobs = jobs.filter((j) => !isLogoStarterPackJob(j));

  if (logoJobs.length > 0) {
    await runStarterPackJobsPool({
      ...poolParams,
      jobs: logoJobs,
      concurrency: 1,
      jobIndexByKey,
    });
  }

  if (otherJobs.length > 0 && !poolParams.abortSignal.aborted) {
    await runStarterPackJobsPool({
      ...poolParams,
      jobs: otherJobs,
      concurrency: otherConcurrency,
      jobIndexByKey,
    });
  }
}
