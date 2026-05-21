import type { AttachmentUploadJob } from "@/lib/brand/queue-attachment-uploads";

/** In-memory stash so home upload can pass files into the brand wizard after navigation. */
let pending: { draftId: string; jobs: AttachmentUploadJob[] } | null = null;

export function stashPendingDraftUploads(
  draftId: string,
  jobs: AttachmentUploadJob[],
): void {
  pending = { draftId, jobs: [...jobs] };
}

export function takePendingDraftUploadJobs(
  draftId: string,
): AttachmentUploadJob[] | undefined {
  if (pending?.draftId !== draftId) return undefined;
  const jobs = pending.jobs;
  pending = null;
  return jobs;
}
