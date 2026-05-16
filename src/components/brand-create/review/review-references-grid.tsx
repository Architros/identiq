"use client";

import { useRef } from "react";
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
  ATTACHMENT_MAX_FILES,
  getAttachmentKind,
} from "@/lib/brand/attachment-utils";

type ReviewReferencesGridProps = {
  attachments: BrandAttachment[];
  onChange: (attachments: BrandAttachment[]) => void;
};

export function ReviewReferencesGrid({
  attachments,
  onChange,
}: ReviewReferencesGridProps) {
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number | null>(null);

  const remove = (id: string) => {
    const item = attachments.find((a) => a.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    onChange(attachments.filter((a) => a.id !== id));
  };

  const triggerReplace = (index: number) => {
    replaceIndexRef.current = index;
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = (file: File | undefined) => {
    const index = replaceIndexRef.current;
    if (index === null || !file || file.size > ATTACHMENT_MAX_BYTES) return;

    const prev = attachments[index];
    if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);

    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : undefined;
    const next = [...attachments];
    next[index] = {
      id: prev?.id ?? `att_${crypto.randomUUID().slice(0, 8)}`,
      name: file.name,
      type: file.type,
      size: file.size,
      previewUrl,
    };
    onChange(next);
    replaceIndexRef.current = null;
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
          handleReplaceFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {attachments.map((file, index) => {
          const kind = getAttachmentKind(file);
          return (
            <div
              key={file.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-sidebar-active"
            >
              {kind === "image" && file.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.previewUrl}
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
                    {kind === "pdf" ? "PDF" : kind === "text" ? "DOC" : "FILE"}
                  </span>
                </div>
              )}

              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-foreground/50 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => triggerReplace(index)}
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
                  className="cursor-pointer rounded-lg bg-surface p-2 text-red-600 shadow-sm hover:bg-red-50"
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
            </div>
          );
        })}
      </div>
    </>
  );
}

export { ATTACHMENT_MAX_FILES };
