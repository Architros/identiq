"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload04Icon,
  Delete02Icon,
  Cancel01Icon,
  TickDouble01Icon,
  ArrowReloadHorizontalIcon,
} from "@hugeicons/core-free-icons";
import type { BrandAttachment } from "@/lib/brand/brand-project-draft";
import { getAttachmentKind } from "@/lib/brand/attachment-utils";
import {
  attachmentDisplayUrl,
  UPLOAD_SAVING_PROGRESS,
} from "@/lib/storage/upload-client";
import { AttachmentPreviewModal } from "@/components/brand-create/attachment-preview-modal";
import { AttachmentUploadThumbnail } from "@/components/brand-create/attachment-upload-thumbnail";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_FILES,
  formatAttachmentSize,
  isAllowedAttachmentFile,
} from "@/lib/brand/attachment-utils";
import {
  attachmentKindLabel,
  placeholdersForJobs,
  queueAttachmentUploads,
  type AttachmentUploadJob,
} from "@/lib/brand/queue-attachment-uploads";
import { cn } from "@/lib/utils";

type AttachmentDropzoneProps = {
  draftId: string;
  attachments: BrandAttachment[];
  onChange: (attachments: BrandAttachment[]) => void;
};

function AttachmentCardMeta({
  file,
  isComplete,
}: {
  file: BrandAttachment;
  isComplete: boolean;
}) {
  const sizeLabel = formatAttachmentSize(file.size);

  if (file.uploading) {
    const saving = (file.uploadProgress ?? 0) >= UPLOAD_SAVING_PROGRESS;
    return (
      <span className="flex items-center gap-1.5 text-xs">
        <span className="text-muted">{saving ? "Saving" : "Uploading"}</span>
        {file.uploadProgress != null && !saving ? (
          <>
            <span className="text-muted/60" aria-hidden>
              ·
            </span>
            <span className="tabular-nums text-muted">
              {Math.round(file.uploadProgress)}%
            </span>
          </>
        ) : null}
        <span className="text-muted/60" aria-hidden>
          ·
        </span>
        <span className="text-muted">{sizeLabel}</span>
      </span>
    );
  }

  if (file.uploadError) {
    return (
      <span className="text-xs text-destructive">{file.uploadError}</span>
    );
  }

  if (isComplete) {
    return (
      <span className="flex items-center gap-1.5 text-xs">
        <span className="font-medium text-success">Uploaded</span>
        <span className="text-muted/60" aria-hidden>
          ·
        </span>
        <span className="text-muted">{sizeLabel}</span>
      </span>
    );
  }

  if (file.size > 0) {
    return <span className="text-xs text-muted">{sizeLabel}</span>;
  }

  return null;
}

export function AttachmentDropzone({
  draftId,
  attachments,
  onChange,
}: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef(attachments);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const pendingFilesRef = useRef<Map<string, File>>(new Map());
  const [previewTarget, setPreviewTarget] = useState<BrandAttachment | null>(
    null,
  );
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  const setAttachments = useCallback(
    (next: BrandAttachment[]) => {
      attachmentsRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  const patchAttachment = useCallback(
    (id: string, patch: Partial<BrandAttachment>) => {
      setAttachments(
        attachmentsRef.current.map((a) =>
          a.id === id ? { ...a, ...patch } : a,
        ),
      );
    },
    [setAttachments],
  );

  const revokePreview = useCallback((item: BrandAttachment | undefined) => {
    if (item?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }, []);

  const cancelUpload = useCallback(
    (id: string) => {
      abortControllersRef.current.get(id)?.abort();
      abortControllersRef.current.delete(id);
      pendingFilesRef.current.delete(id);
      const item = attachmentsRef.current.find((a) => a.id === id);
      revokePreview(item);
      setAttachments(attachmentsRef.current.filter((a) => a.id !== id));
    },
    [revokePreview, setAttachments],
  );

  const runUploadJobs = useCallback(
    async (jobs: AttachmentUploadJob[]) => {
      if (jobs.length === 0) return;

      await queueAttachmentUploads({
        jobs,
        draftId,
        getSignal: (id) => {
          const controller = new AbortController();
          abortControllersRef.current.set(id, controller);
          return controller.signal;
        },
        onPatch: (id, patch) => {
          patchAttachment(id, { uploading: true, uploadError: undefined, ...patch });
        },
        onComplete: (id, stored) => {
          abortControllersRef.current.delete(id);
          pendingFilesRef.current.delete(id);
          const prev = attachmentsRef.current.find((a) => a.id === id);
          revokePreview(prev);
          setAttachments(
            attachmentsRef.current.map((a) => (a.id === id ? stored : a)),
          );
        },
        onFailed: (id, message) => {
          abortControllersRef.current.delete(id);
          patchAttachment(id, {
            uploading: false,
            uploadProgress: undefined,
            uploadError: message,
          });
        },
        onAborted: (id) => {
          abortControllersRef.current.delete(id);
          pendingFilesRef.current.delete(id);
          const item = attachmentsRef.current.find((a) => a.id === id);
          revokePreview(item);
          setAttachments(attachmentsRef.current.filter((a) => a.id !== id));
        },
      });
    },
    [draftId, patchAttachment, revokePreview, setAttachments],
  );

  const retryUpload = useCallback(
    (id: string) => {
      const file = pendingFilesRef.current.get(id);
      if (!file) return;
      patchAttachment(id, {
        uploading: true,
        uploadProgress: 0,
        uploadError: undefined,
      });
      void runUploadJobs([{ id, file }]);
    },
    [patchAttachment, runUploadJobs],
  );

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      setGlobalError(null);

      const jobs: AttachmentUploadJob[] = [];
      let count = attachmentsRef.current.length;
      const tooLarge: string[] = [];
      let skippedUnsupported = 0;

      for (const file of Array.from(files)) {
        if (count >= ATTACHMENT_MAX_FILES) break;
        if (!isAllowedAttachmentFile(file)) {
          if (file.size > ATTACHMENT_MAX_BYTES) {
            tooLarge.push(file.name);
          } else {
            skippedUnsupported += 1;
          }
          continue;
        }
        const id = `att_${crypto.randomUUID().slice(0, 8)}`;
        pendingFilesRef.current.set(id, file);
        jobs.push({ id, file });
        count += 1;
      }

      if (tooLarge.length > 0) {
        setGlobalError(
          `${tooLarge.length} file(s) exceed 10MB and were skipped.`,
        );
      }

      if (jobs.length === 0) return;

      setAttachments(placeholdersForJobs(jobs, attachmentsRef.current));
      await runUploadJobs(jobs);
    },
    [runUploadJobs, setAttachments],
  );

  const remove = (id: string) => {
    const item = attachmentsRef.current.find((a) => a.id === id);
    if (item?.uploading) {
      cancelUpload(id);
      return;
    }
    revokePreview(item);
    pendingFilesRef.current.delete(id);
    setAttachments(attachmentsRef.current.filter((a) => a.id !== id));
    if (previewTarget?.id === id) setPreviewTarget(null);
  };

  const uploadingCount = attachments.filter((a) => a.uploading).length;
  const atMaxFiles = attachments.length >= ATTACHMENT_MAX_FILES;

  return (
    <>
      <div className="space-y-4">
        {uploadingCount > 1 ? (
          <p className="text-sm font-medium text-muted">
            Uploading {uploadingCount} of {attachments.length}
          </p>
        ) : null}

        <button
          type="button"
          disabled={atMaxFiles}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center transition-colors hover:border-accent/50 hover:bg-sidebar-active/30",
            atMaxFiles && "pointer-events-none opacity-60",
          )}
        >
          <HugeiconsIcon
            icon={Upload04Icon}
            size={28}
            color="currentColor"
            strokeWidth={1.5}
            className="text-muted"
          />
          <span className="text-sm font-medium text-foreground">
            Drop files or click to upload
          </span>
          <span className="text-xs text-muted">
            PNG, JPG, WEBP, TXT, MD — up to {ATTACHMENT_MAX_FILES} files,
            10MB each. Files are saved to cloud storage.
          </span>
        </button>
        {globalError ? (
          <p className="text-xs text-destructive" role="alert">
            {globalError}
          </p>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={ATTACHMENT_ACCEPT}
          multiple
          className="hidden"
          disabled={atMaxFiles}
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {attachments.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {attachments.map((file) => {
              const thumb = attachmentDisplayUrl(file);
              const kind = getAttachmentKind(file);
              const fileLabel = attachmentKindLabel(file);
              const isComplete = Boolean(file.url) && !file.uploading;
              const canRetry = Boolean(file.uploadError) && !file.uploading;

              return (
                <li
                  key={file.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface"
                >
                  <button
                    type="button"
                    onClick={() =>
                      !file.uploading && !file.uploadError && setPreviewTarget(file)
                    }
                    disabled={file.uploading || Boolean(file.uploadError)}
                    className="relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center bg-sidebar-active/40 text-left disabled:cursor-default"
                  >
                    {file.uploading ? (
                      <AttachmentUploadThumbnail
                        previewUrl={thumb}
                        progress={file.uploadProgress ?? 0}
                        isImage={kind === "image"}
                        fileLabel={fileLabel}
                        className="h-full w-full rounded-none border-0"
                      />
                    ) : thumb && kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-muted">
                        {fileLabel}
                      </span>
                    )}
                  </button>

                  <div className="flex items-start gap-1 border-t border-border px-2 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <AttachmentCardMeta file={file} isComplete={isComplete} />
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      {canRetry ? (
                        <button
                          type="button"
                          onClick={() => retryUpload(file.id)}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-sidebar-active hover:text-foreground"
                          aria-label={`Retry upload of ${file.name}`}
                        >
                          <HugeiconsIcon
                            icon={ArrowReloadHorizontalIcon}
                            size={16}
                            color="currentColor"
                            strokeWidth={1.75}
                          />
                        </button>
                      ) : null}
                      {file.uploading ? (
                        <button
                          type="button"
                          onClick={() => cancelUpload(file.id)}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-sidebar-active hover:text-foreground"
                          aria-label={`Cancel upload of ${file.name}`}
                        >
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            size={16}
                            color="currentColor"
                            strokeWidth={1.75}
                          />
                        </button>
                      ) : (
                        <>
                          {isComplete ? (
                            <span
                              className="inline-flex h-8 w-8 items-center justify-center text-success"
                              title="Upload complete"
                              aria-label="Upload complete"
                            >
                              <HugeiconsIcon
                                icon={TickDouble01Icon}
                                size={18}
                                color="currentColor"
                                strokeWidth={1.75}
                              />
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => remove(file.id)}
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-sidebar-active hover:text-destructive"
                            aria-label={`Remove ${file.name}`}
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              size={16}
                              color="currentColor"
                              strokeWidth={1.75}
                            />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      <AttachmentPreviewModal
        attachment={previewTarget}
        onClose={() => setPreviewTarget(null)}
      />
    </>
  );
}
