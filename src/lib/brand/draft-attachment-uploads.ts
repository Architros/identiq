import type { BrandAttachment } from "@/lib/brand/brand-project-draft";
import {
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_FILES,
  isAllowedAttachmentFile,
} from "@/lib/brand/attachment-utils";
import {
  placeholdersForJobs,
  queueAttachmentUploads,
  type AttachmentUploadJob,
} from "@/lib/brand/queue-attachment-uploads";

export type PrepareAttachmentJobsResult = {
  jobs: AttachmentUploadJob[];
  pendingFiles: Map<string, File>;
  tooLarge: string[];
};

export function prepareAttachmentJobs(
  files: Iterable<File>,
  existingCount: number,
): PrepareAttachmentJobsResult {
  const jobs: AttachmentUploadJob[] = [];
  const pendingFiles = new Map<string, File>();
  const tooLarge: string[] = [];
  let count = existingCount;

  for (const file of files) {
    if (count >= ATTACHMENT_MAX_FILES) break;
    if (!isAllowedAttachmentFile(file)) {
      if (file.size > ATTACHMENT_MAX_BYTES) {
        tooLarge.push(file.name);
      }
      continue;
    }
    const id = `att_${crypto.randomUUID().slice(0, 8)}`;
    pendingFiles.set(id, file);
    jobs.push({ id, file });
    count += 1;
  }

  return { jobs, pendingFiles, tooLarge };
}

type RunDraftAttachmentUploadsParams = {
  draftId: string;
  jobs: AttachmentUploadJob[];
  attachments: BrandAttachment[];
  pendingFiles: Map<string, File>;
  onAttachmentsChange: (next: BrandAttachment[]) => void;
};

export async function runDraftAttachmentUploads({
  draftId,
  jobs,
  attachments,
  pendingFiles,
  onAttachmentsChange,
}: RunDraftAttachmentUploadsParams): Promise<void> {
  if (jobs.length === 0) return;

  let current = placeholdersForJobs(jobs, attachments);
  onAttachmentsChange(current);

  const abortControllers = new Map<string, AbortController>();

  const patch = (id: string, patchFields: Partial<BrandAttachment>) => {
    current = current.map((a) =>
      a.id === id ? { ...a, ...patchFields } : a,
    );
    onAttachmentsChange(current);
  };

  const revokePreview = (item: BrandAttachment | undefined) => {
    if (item?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(item.previewUrl);
    }
  };

  await queueAttachmentUploads({
    jobs,
    draftId,
    getSignal: (id) => {
      const controller = new AbortController();
      abortControllers.set(id, controller);
      return controller.signal;
    },
    onPatch: (id, patchFields) => {
      patch(id, { uploading: true, uploadError: undefined, ...patchFields });
    },
    onComplete: (id, stored) => {
      abortControllers.delete(id);
      pendingFiles.delete(id);
      const prev = current.find((a) => a.id === id);
      revokePreview(prev);
      current = current.map((a) => (a.id === id ? stored : a));
      onAttachmentsChange(current);
    },
    onFailed: (id, message) => {
      abortControllers.delete(id);
      patch(id, {
        uploading: false,
        uploadProgress: undefined,
        uploadError: message,
      });
    },
    onAborted: (id) => {
      abortControllers.delete(id);
      pendingFiles.delete(id);
      const item = current.find((a) => a.id === id);
      revokePreview(item);
      current = current.filter((a) => a.id !== id);
      onAttachmentsChange(current);
    },
  });
}
