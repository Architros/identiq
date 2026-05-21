import { getWizardSession } from "@/lib/brand/pending-wizard-session";
import type { AttachmentUploadJob } from "@/lib/brand/queue-attachment-uploads";

/** @deprecated Prefer `getWizardSession` — kept for imports that only need upload jobs. */
export function takePendingDraftUploadJobs(
  draftId: string,
): AttachmentUploadJob[] | undefined {
  return getWizardSession(draftId)?.jobs;
}
