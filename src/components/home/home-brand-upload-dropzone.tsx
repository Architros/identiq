"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload04Icon } from "@hugeicons/core-free-icons";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_FILES,
} from "@/lib/brand/attachment-utils";
import { createEmptyDraft } from "@/lib/brand/brand-project-draft";
import { prepareAttachmentJobs } from "@/lib/brand/draft-attachment-uploads";
import { placeholdersForJobs } from "@/lib/brand/queue-attachment-uploads";
import { stashWizardSession } from "@/lib/brand/pending-wizard-session";
import { cn } from "@/lib/utils";

type HomeBrandUploadDropzoneProps = {
  variant?: "card" | "wide";
  className?: string;
};

export function HomeBrandUploadDropzone({
  variant = "card",
  className,
}: HomeBrandUploadDropzoneProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startUpload = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || isStarting) return;
      setError(null);
      setIsStarting(true);

      try {
        const draft = createEmptyDraft();
        const fileArray = Array.from(files);
        const { jobs, tooLarge } = prepareAttachmentJobs(fileArray, 0);

        if (jobs.length === 0) {
          setError(
            tooLarge.length > 0
              ? "Files must be 10MB or smaller."
              : "No supported files selected.",
          );
          return;
        }

        if (tooLarge.length > 0) {
          setError(
            `${tooLarge.length} file(s) over 10MB were skipped.`,
          );
        }

        const attachments = placeholdersForJobs(jobs, []);
        stashWizardSession({ ...draft, attachments }, jobs);

        router.push(`/new-brand?draftId=${encodeURIComponent(draft.id)}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setIsStarting(false);
      }
    },
    [isStarting, router],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    void startUpload(e.dataTransfer.files);
  };

  const isWide = variant === "wide";

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col",
        isWide ? className : cn("h-full", className),
      )}
    >
      <button
        type="button"
        disabled={isStarting}
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center transition-colors",
          "border-border/80 bg-sidebar-active/30 hover:border-accent/40 hover:bg-sidebar-active/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-60",
          isWide ? "min-h-[10rem] px-6 py-10" : "h-full px-4 py-6",
          isDragging && "border-accent/50 bg-sidebar-active/60",
        )}
      >
        <HugeiconsIcon
          icon={Upload04Icon}
          size={isWide ? 28 : 22}
          color="currentColor"
          strokeWidth={1.5}
          className="text-muted"
        />
        <span className="text-xs font-medium text-foreground">
          {isStarting ? "Starting upload…" : "Drop files or click to upload"}
        </span>
        <span className="max-w-[14rem] text-[10px] leading-snug text-muted">
          PNG, JPG, WEBP, PDF, TXT — up to {ATTACHMENT_MAX_FILES} files
        </span>
      </button>

      {error ? (
        <p className="mt-1.5 text-center text-[10px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        multiple
        className="hidden"
        disabled={isStarting}
        onChange={(e) => {
          void startUpload(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
