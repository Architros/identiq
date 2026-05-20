import type { BrandAttachment } from "@/lib/brand/brand-project-draft";
import { getAttachmentKind } from "@/lib/brand/attachment-utils";
import {
  UploadAbortedError,
  uploadReferenceToStorage,
} from "@/lib/storage/upload-client";
import { runWithConcurrency } from "@/lib/brand/upload-with-concurrency";

export type AttachmentUploadJob = {
  id: string;
  file: File;
  replaceId?: string;
};

export function createAttachmentPlaceholder(
  file: File,
  id: string,
): BrandAttachment {
  const isImage = file.type.startsWith("image/");
  return {
    id,
    name: file.name,
    type: file.type,
    size: file.size,
    previewUrl: isImage ? URL.createObjectURL(file) : undefined,
    uploading: true,
    uploadProgress: 0,
  };
}

export function placeholdersForJobs(
  jobs: AttachmentUploadJob[],
  current: BrandAttachment[],
): BrandAttachment[] {
  let next = [...current];
  for (const job of jobs) {
    const placeholder = createAttachmentPlaceholder(job.file, job.id);
    next = job.replaceId
      ? next.map((a) => (a.id === job.replaceId ? placeholder : a))
      : [...next, placeholder];
  }
  return next;
}

type QueueAttachmentUploadsParams = {
  jobs: AttachmentUploadJob[];
  draftId: string;
  concurrency?: number;
  getSignal: (id: string) => AbortSignal;
  onPatch: (id: string, patch: Partial<BrandAttachment>) => void;
  onComplete: (id: string, attachment: BrandAttachment) => void;
  onFailed: (id: string, message: string) => void;
  onAborted: (id: string) => void;
};

export async function queueAttachmentUploads({
  jobs,
  draftId,
  concurrency = 3,
  getSignal,
  onPatch,
  onComplete,
  onFailed,
  onAborted,
}: QueueAttachmentUploadsParams): Promise<void> {
  await runWithConcurrency(jobs, concurrency, async (job) => {
    const { id, file } = job;

    try {
      const uploaded = await uploadReferenceToStorage({
        file,
        draftId,
        attachmentId: id,
        signal: getSignal(id),
        onProgress: (percent) => {
          onPatch(id, { uploadProgress: percent });
        },
      });

      const stored: BrandAttachment = {
        id: uploaded.id,
        name: uploaded.name,
        type: uploaded.type,
        size: uploaded.size,
        url: uploaded.url,
        storageKey: uploaded.storageKey,
        previewUrl: uploaded.previewUrl ?? uploaded.url,
        uploadProgress: 100,
      };

      onComplete(id, stored);
    } catch (err) {
      if (err instanceof UploadAbortedError) {
        onAborted(id);
        return;
      }

      const message = err instanceof Error ? err.message : "Upload failed";
      onFailed(id, message);
    }
  });
}

export function attachmentKindLabel(file: BrandAttachment): string {
  const kind = getAttachmentKind(file);
  return kind === "text" ? "DOC" : kind === "pdf" ? "PDF" : "FILE";
}
