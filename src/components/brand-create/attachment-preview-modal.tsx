"use client";

import { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import type { BrandAttachment } from "@/lib/brand/brand-project-draft";
import { isAllowedRasterImageType } from "@/lib/brand/attachment-utils";
import { attachmentDisplayUrl } from "@/lib/storage/upload-client";

type AttachmentPreviewModalProps = {
  attachment: BrandAttachment | null;
  onClose: () => void;
};

export function AttachmentPreviewModal({
  attachment,
  onClose,
}: AttachmentPreviewModalProps) {
  useEffect(() => {
    if (!attachment) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [attachment, onClose]);

  if (!attachment) return null;

  const isImage = isAllowedRasterImageType(
    attachment.type,
    attachment.name,
  );
  const imageUrl = attachmentDisplayUrl(attachment);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${attachment.name}`}
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="truncate text-sm font-medium text-foreground">
            {attachment.name}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-sidebar-active hover:text-foreground"
            aria-label="Close preview"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={18}
              color="currentColor"
              strokeWidth={1.75}
            />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-background p-4">
          {isImage && imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={attachment.name}
              className="max-h-[70vh] max-w-full rounded-lg object-contain"
            />
          ) : (
            <p className="text-sm text-muted">Preview not available for this file.</p>
          )}
        </div>
      </div>
    </div>
  );
}
