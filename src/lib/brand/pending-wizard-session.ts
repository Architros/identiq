import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";
import type { AttachmentUploadJob } from "@/lib/brand/queue-attachment-uploads";

/** In-memory wizard bootstrap (home upload → /new-brand) without persisting to drafts list. */
let pending: {
  draftId: string;
  draft: BrandProjectDraft;
  jobs: AttachmentUploadJob[];
} | null = null;

export function stashWizardSession(
  draft: BrandProjectDraft,
  jobs: AttachmentUploadJob[],
): void {
  pending = {
    draftId: draft.id,
    draft,
    jobs: [...jobs],
  };
}

export function getWizardSession(draftId: string): {
  draft: BrandProjectDraft;
  jobs: AttachmentUploadJob[];
} | undefined {
  if (pending?.draftId !== draftId) return undefined;
  return { draft: pending.draft, jobs: pending.jobs };
}

/** Returns the pending session once, then clears it (home → wizard handoff). */
export function takeWizardSession(draftId: string): {
  draft: BrandProjectDraft;
  jobs: AttachmentUploadJob[];
} | undefined {
  const session = getWizardSession(draftId);
  if (session) clearWizardSession(draftId);
  return session;
}

export function clearWizardSession(draftId: string): void {
  if (pending?.draftId === draftId) pending = null;
}
