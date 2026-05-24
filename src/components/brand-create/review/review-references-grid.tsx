"use client";

import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete02Icon,
  Upload04Icon,
  File01Icon,
} from "@hugeicons/core-free-icons";
import type { BrandAttachment } from "@/lib/brand/brand-project-draft";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  getAttachmentKind,
} from "@/lib/brand/attachment-utils";
import {
  attachmentDisplayUrl,
  uploadReferenceToStorage,
} from "@/lib/storage/upload-client";

type ReviewReferencesGridProps = {
  draftId: string;
  attachments: BrandAttachment[];
  onChange: (attachments: BrandAttachment[]) => void;
};

export function ReviewReferencesGrid({
  draftId,
  attachments,
  onChange,
}: ReviewReferencesGridProps) {
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remove = (id: string) => {
    const item = attachments.find((a) => a.id === id);
    if (item?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(item.previewUrl);
    }
    onChange(attachments.filter((a) => a.id !== id));
  };

  const triggerReplace = (id: string) => {
    replaceIdRef.current = id;
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = async (file: File | undefined) => {
    const replaceId = replaceIdRef.current;
    if (!replaceId || !file || file.size > ATTACHMENT_MAX_BYTES) return;

    const prev = attachments.find((a) => a.id === replaceId);
    if (prev?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(prev.previewUrl);
    }

    const placeholder: BrandAttachment = {
      id: replaceId,
      name: file.name,
      type: file.type,
      size: file.size,
      uploading: true,
    };
    onChange(
      attachments.map((a) => (a.id === replaceId ? placeholder : a)),
    );

    try {
      const uploaded = await uploadReferenceToStorage({
        file,
        draftId,
        attachmentId: replaceId,
      });
      const stored: BrandAttachment = {
        id: uploaded.id,
        name: uploaded.name,
        type: uploaded.type,
        size: uploaded.size,
        url: uploaded.url,
        storageKey: uploaded.storageKey,
        previewUrl: uploaded.previewUrl ?? uploaded.url,
      };
      onChange(
        attachments.map((a) => (a.id === replaceId ? stored : a)),
      );
      setError(null);
    } catch (err) {
      onChange(attachments.map((a) => (a.id === replaceId ? prev! : a)));
      setError(err instanceof Error ? err.message : "Replace failed");
    }

    replaceIdRef.current = null;
  };

  if (attachments.length === 0) {
    return <p className="text-sm text-muted">No reference files added.</p>;
  }

  return (
    <>
      <input
        ref={replaceInputRef}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          void handleReplaceFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error ? (
        <p className="mb-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {attachments.map((file) => {
          const kind = getAttachmentKind(file);
          const thumb = attachmentDisplayUrl(file);
          return (
            <div
              key={file.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-sidebar-active"
            >
              {file.uploading ? (
                <div className="flex h-full items-center justify-center text-sm text-muted">
                  …
                </div>
              ) : kind === "image" && thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center">
                  <HugeiconsIcon
                    icon={File01Icon}
                    size={24}
                    color="currentColor"
                    strokeWidth={1.5}
                    className="text-muted"
                  />
                  <span className="text-[10px] font-medium uppercase text-muted">
                    {kind === "text" ? "DOC" : kind === "image" ? "IMG" : "FILE"}
                  </span>
                </div>
              )}

              {!file.uploading ? (
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => triggerReplace(file.id)}
                    className="cursor-pointer rounded-lg bg-surface p-2 text-foreground shadow-sm hover:bg-sidebar-active"
                    aria-label="Replace file"
                  >
                    <HugeiconsIcon
                      icon={Upload04Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.75}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(file.id)}
                    className="cursor-pointer rounded-lg bg-surface p-2 text-destructive shadow-sm hover:bg-destructive-muted"
                    aria-label="Remove file"
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.75}
                    />
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
