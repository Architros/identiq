"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload04Icon,
  Delete02Icon,
  Cancel01Icon,
  TickDouble01Icon,
} from "@hugeicons/core-free-icons";
import type { BrandAttachment } from "@/lib/brand/brand-project-draft";
import { getAttachmentKind } from "@/lib/brand/attachment-utils";
import {
  attachmentDisplayUrl,
  UploadAbortedError,
  UPLOAD_SAVING_PROGRESS,
  uploadReferenceToStorage,
} from "@/lib/storage/upload-client";
import { AttachmentPreviewModal } from "@/components/brand-create/attachment-preview-modal";
import { AttachmentUploadThumbnail } from "@/components/brand-create/attachment-upload-thumbnail";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_FILES,
  formatAttachmentSize,
} from "@/lib/brand/attachment-utils";
import { cn } from "@/lib/utils";

type AttachmentDropzoneProps = {
  draftId: string;
  attachments: BrandAttachment[];
  onChange: (attachments: BrandAttachment[]) => void;
};

function AttachmentRowMeta({
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
        <span className="text-muted/60" aria-hidden>
          ·
        </span>
        <span className="text-muted">{sizeLabel}</span>
      </span>
    );
  }

  if (file.uploadError) {
    return (
      <span className="text-xs text-red-600">{file.uploadError}</span>
    );
  }

  if (isComplete) {
    return (
      <span className="flex items-center gap-1.5 text-xs">
        <span className="font-medium text-emerald-600">Uploaded</span>
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

function AttachmentRowActions({
  file,
  isComplete,
  onCancel,
  onRemove,
}: {
  file: BrandAttachment;
  isComplete: boolean;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const actionBtnClass =
    "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-sidebar-active hover:text-foreground";

  if (file.uploading) {
    return (
      <button
        type="button"
        onClick={onCancel}
        className={actionBtnClass}
        aria-label={`Cancel upload of ${file.name}`}
      >
        <HugeiconsIcon
          icon={Cancel01Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.75}
        />
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {isComplete ? (
        <span
          className="inline-flex h-8 w-8 items-center justify-center text-emerald-600"
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
        onClick={onRemove}
        className={cn(actionBtnClass, "hover:text-red-600")}
        aria-label={`Remove ${file.name}`}
      >
        <HugeiconsIcon
          icon={Delete02Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.75}
        />
      </button>
    </div>
  );
}

export function AttachmentDropzone({
  draftId,
  attachments,
  onChange,
}: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef(attachments);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
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

  const cancelUpload = useCallback(
    (id: string) => {
      abortControllersRef.current.get(id)?.abort();
      abortControllersRef.current.delete(id);
      const item = attachmentsRef.current.find((a) => a.id === id);
      if (item?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(item.previewUrl);
      }
      setAttachments(attachmentsRef.current.filter((a) => a.id !== id));
    },
    [setAttachments],
  );

  const uploadFile = useCallback(
    async (file: File, replaceId?: string) => {
      const id = replaceId ?? `att_${crypto.randomUUID().slice(0, 8)}`;
      const isImage = file.type.startsWith("image/");
      const blobPreview = isImage ? URL.createObjectURL(file) : undefined;
      const controller = new AbortController();
      abortControllersRef.current.set(id, controller);

      const placeholder: BrandAttachment = {
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl: blobPreview,
        uploading: true,
        uploadProgress: 0,
      };

      const withPlaceholder = replaceId
        ? attachmentsRef.current.map((a) => (a.id === replaceId ? placeholder : a))
        : [...attachmentsRef.current, placeholder];
      setAttachments(withPlaceholder);

      try {
        const uploaded = await uploadReferenceToStorage({
          file,
          draftId,
          attachmentId: id,
          signal: controller.signal,
          onProgress: (percent) => {
            patchAttachment(id, { uploadProgress: percent });
          },
        });

        abortControllersRef.current.delete(id);
        if (blobPreview) URL.revokeObjectURL(blobPreview);

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

        setAttachments(
          attachmentsRef.current.map((a) => (a.id === id ? stored : a)),
        );
        setGlobalError(null);
      } catch (err) {
        abortControllersRef.current.delete(id);
        if (blobPreview) URL.revokeObjectURL(blobPreview);

        if (err instanceof UploadAbortedError) {
          setAttachments(attachmentsRef.current.filter((a) => a.id !== id));
          return;
        }

        const message =
          err instanceof Error ? err.message : "Upload failed";
        setAttachments(attachmentsRef.current.filter((a) => a.id !== id));
        setGlobalError(message);
      }
    },
    [draftId, patchAttachment, setAttachments],
  );

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      setGlobalError(null);
      let count = attachmentsRef.current.length;
      for (const file of Array.from(files)) {
        if (count >= ATTACHMENT_MAX_FILES) break;
        if (file.size > ATTACHMENT_MAX_BYTES) continue;
        count += 1;
        await uploadFile(file);
      }
    },
    [uploadFile],
  );

  const remove = (id: string) => {
    const item = attachmentsRef.current.find((a) => a.id === id);
    if (item?.uploading) {
      cancelUpload(id);
      return;
    }
    if (item?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(item.previewUrl);
    }
    setAttachments(attachmentsRef.current.filter((a) => a.id !== id));
    if (previewTarget?.id === id) setPreviewTarget(null);
  };

  const isUploading = attachments.some((a) => a.uploading);

  return (
    <>
      <div className="space-y-4">
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center transition-colors hover:border-accent/50 hover:bg-sidebar-active/30",
            isUploading && "pointer-events-none opacity-60",
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
            PNG, JPG, WEBP, PDF, TXT, MD — up to {ATTACHMENT_MAX_FILES} files,
            10MB each. Files are saved to cloud storage.
          </span>
        </button>
        {globalError ? (
          <p className="text-xs text-red-600" role="alert">
            {globalError}
          </p>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={ATTACHMENT_ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            void addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {attachments.length > 0 ? (
          <ul className="space-y-2">
            {attachments.map((file) => {
              const thumb = attachmentDisplayUrl(file);
              const kind = getAttachmentKind(file);
              const fileLabel =
                kind === "text" ? "DOC" : kind === "pdf" ? "PDF" : "FILE";
              const isComplete = Boolean(file.url) && !file.uploading;

              return (
                <li
                  key={file.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => !file.uploading && setPreviewTarget(file)}
                    disabled={file.uploading}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left disabled:cursor-wait"
                  >
                    {file.uploading ? (
                      <AttachmentUploadThumbnail
                        previewUrl={thumb}
                        progress={file.uploadProgress ?? 0}
                        isImage={kind === "image"}
                        fileLabel={fileLabel}
                      />
                    ) : thumb && kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-active text-xs font-medium text-muted">
                        {fileLabel}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {file.name}
                      </span>
                      <AttachmentRowMeta file={file} isComplete={isComplete} />
                    </span>
                  </button>

                  <AttachmentRowActions
                    file={file}
                    isComplete={isComplete}
                    onCancel={() => cancelUpload(file.id)}
                    onRemove={() => remove(file.id)}
                  />
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
