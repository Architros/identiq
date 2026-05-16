"use client";

import { useCallback, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload04Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import type { BrandAttachment } from "@/lib/brand/brand-project-draft";
import { getAttachmentKind } from "@/lib/brand/attachment-utils";
import { AttachmentPreviewModal } from "@/components/brand-create/attachment-preview-modal";

import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_FILES,
} from "@/lib/brand/attachment-utils";

type AttachmentDropzoneProps = {
  attachments: BrandAttachment[];
  onChange: (attachments: BrandAttachment[]) => void;
};

export function AttachmentDropzone({
  attachments,
  onChange,
}: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewTarget, setPreviewTarget] = useState<BrandAttachment | null>(
    null,
  );

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const next = [...attachments];
      for (const file of Array.from(files)) {
        if (next.length >= ATTACHMENT_MAX_FILES) break;
        if (file.size > ATTACHMENT_MAX_BYTES) continue;
        const isImage = file.type.startsWith("image/");
        const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
        next.push({
          id: `att_${crypto.randomUUID().slice(0, 8)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          previewUrl,
        });
      }
      onChange(next);
    },
    [attachments, onChange],
  );

  const remove = (id: string) => {
    const item = attachments.find((a) => a.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    onChange(attachments.filter((a) => a.id !== id));
    if (previewTarget?.id === id) setPreviewTarget(null);
  };

  return (
    <>
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
          className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center hover:border-accent/50 hover:bg-sidebar-active/30"
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
            10MB each
          </span>
          <span className="text-xs text-muted">
            Click a file below to preview. Used for brand direction (metadata in
            v1).
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ATTACHMENT_ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {attachments.length > 0 ? (
          <ul className="space-y-2">
            {attachments.map((file) => (
              <li
                key={file.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => setPreviewTarget(file)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                >
                  {file.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.previewUrl}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-active text-xs font-medium text-muted">
                      {getAttachmentKind(file) === "text"
                        ? "DOC"
                        : getAttachmentKind(file) === "pdf"
                          ? "PDF"
                          : "FILE"}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {file.name}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(file.id)}
                  className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-sidebar-active hover:text-foreground"
                  aria-label={`Remove ${file.name}`}
                >
                  <HugeiconsIcon
                    icon={Delete02Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.75}
                  />
                </button>
              </li>
            ))}
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
