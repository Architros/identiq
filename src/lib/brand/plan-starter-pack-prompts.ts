import { generateObject } from "ai";
import { z } from "zod";
import { llmModel } from "@/lib/ai/providers";
import type { ExpandedAssetJob } from "@/lib/brand/asset-catalog";
import {
  buildStarterItemPrompt,
  type StarterPromptVariantOptions,
} from "@/lib/brand/build-starter-prompt";
import { catalogItemToStarterItem } from "@/lib/brand/starter-pack";
import type { WizardOrchestrateInput } from "@/lib/brand/brand-memory-schema";
import type { BrandMemory } from "@/lib/brand/types";
import {
  brandContextFromWizard,
  buildStarterPackPlannerSystemPrompt,
  buildStarterPackPlannerUserContext,
  referenceBundleFromWizard,
} from "@/lib/brand/prompt-structure";

const plannedJobSchema = z.object({
  jobKey: z.string(),
  prompt: z.string(),
  variantLabel: z.string(),
});

export const starterPackPlanSchema = z.object({
  jobs: z.array(plannedJobSchema),
});

export type PlannedStarterPackJob = z.infer<typeof plannedJobSchema>;
export type StarterPackPlan = z.infer<typeof starterPackPlanSchema>;

function jobTitle(job: ExpandedAssetJob): string {
  return job.instance > 0
    ? `${job.item.title} (${job.instance + 1})`
    : job.item.title;
}

function countInstancesForCatalog(
  jobs: ExpandedAssetJob[],
  catalogId: string,
): number {
  return jobs.filter((j) => j.item.id === catalogId).length;
}

export function buildFallbackStarterPackPlan(
  jobs: ExpandedAssetJob[],
  memory: BrandMemory,
  input: WizardOrchestrateInput,
): StarterPackPlan {
  return {
    jobs: jobs.map((job) => {
      const item = catalogItemToStarterItem(job.item);
      const totalInstances = countInstancesForCatalog(jobs, job.item.id);
      const variant: StarterPromptVariantOptions = {
        instance: job.instance,
        totalInstances,
      };
      return {
        jobKey: job.jobKey,
        prompt: buildStarterItemPrompt(item, memory, input, variant),
        variantLabel:
          totalInstances > 1
            ? `Variant ${job.instance + 1}`
            : "Standard",
      };
    }),
  };
}

function buildJobsDescription(jobs: ExpandedAssetJob[]): string {
  return jobs
    .map((job) => {
      const total = countInstancesForCatalog(jobs, job.item.id);
      return `- jobKey: ${job.jobKey} | title: ${jobTitle(job)} | type: ${job.item.id} | category: ${job.item.category} | aspect: ${job.aspectRatio} | instance: ${job.instance + 1}/${total} | base intent: ${job.item.prompt}`;
    })
    .join("\n");
}

export async function planStarterPackPrompts(
  input: WizardOrchestrateInput,
  memory: BrandMemory,
  jobs: ExpandedAssetJob[],
  abortSignal?: AbortSignal,
): Promise<StarterPackPlan> {
  if (jobs.length === 0) {
    return { jobs: [] };
  }

  const brand = brandContextFromWizard(input, memory);
  const references = referenceBundleFromWizard(input);

  try {
    const { object } = await generateObject({
      model: llmModel,
      schema: starterPackPlanSchema,
      abortSignal,
      system: buildStarterPackPlannerSystemPrompt(),
      prompt: buildStarterPackPlannerUserContext(
        brand,
        buildJobsDescription(jobs),
        references,
      ),
    });

    const byKey = new Map(object.jobs.map((j) => [j.jobKey, j]));
    const merged = jobs.map((job) => {
      const planned = byKey.get(job.jobKey);
      if (planned) return planned;
      const fallback = buildFallbackStarterPackPlan([job], memory, input).jobs[0];
      return fallback!;
    });

    return { jobs: merged };
  } catch {
    return buildFallbackStarterPackPlan(jobs, memory, input);
  }
}

export function plannedJobsByKey(
  plan: StarterPackPlan,
): Map<string, PlannedStarterPackJob> {
  return new Map(plan.jobs.map((j) => [j.jobKey, j]));
}
