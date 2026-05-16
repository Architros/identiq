"use client";

import { cn } from "@/lib/utils";

type AttachmentUploadThumbnailProps = {
  previewUrl?: string;
  progress: number;
  isImage: boolean;
  fileLabel?: string;
  className?: string;
};

export function AttachmentUploadThumbnail({
  previewUrl,
  progress,
  isImage,
  fileLabel,
  className,
}: AttachmentUploadThumbnailProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div
      className={cn(
        "relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-sidebar-active",
        className,
      )}
      aria-hidden
    >
      {isImage && previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45 saturate-[0.85]"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-muted">
          {fileLabel ?? "FILE"}
        </span>
      )}

      <div
        className="absolute inset-x-0 bottom-0 overflow-hidden transition-[height] duration-150 ease-out"
        style={{ height: `${clamped}%` }}
      >
        <div className="attachment-fluid-fill absolute inset-0 bg-gradient-to-t from-accent via-accent/90 to-accent/60" />
        <div className="attachment-fluid-surface absolute -top-1 left-[-15%] h-2.5 w-[130%] rounded-[100%] bg-accent/35" />
      </div>

      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {clamped}%
      </span>
    </div>
  );
}
