"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload04Icon,
  Delete02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import type { BrandAttachment } from "@/lib/brand/brand-project-draft";
import { attachmentDisplayUrl } from "@/lib/storage/upload-client";
import {
  UploadAbortedError,
  UPLOAD_SAVING_PROGRESS,
  uploadReferenceToStorage,
} from "@/lib/storage/upload-client";
import { AttachmentUploadThumbnail } from "@/components/brand-create/attachment-upload-thumbnail";
import {
  firstAllowedRasterImageFile,
  imageFileFromClipboard,
  isAllowedRasterImageType,
} from "@/lib/brand/attachment-utils";
import { cn } from "@/lib/utils";

type LogoUploadProps = {
  draftId: string;
  logo: BrandAttachment | null | undefined;
  onChange: (logo: BrandAttachment | null) => void;
};

export function LogoUpload({ draftId, logo, onChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const uploadLogo = useCallback(
    async (file: File) => {
      if (!isAllowedRasterImageType(file.type, file.name)) {
        setError("Logo must be a PNG, JPG, or WEBP file (SVG not supported).");
        return;
      }

      const id = logo?.id ?? `logo_${crypto.randomUUID().slice(0, 8)}`;
      const blobPreview = URL.createObjectURL(file);
      const controller = new AbortController();
      abortRef.current = controller;

      const placeholder: BrandAttachment = {
        id,
        name: file.name,
        type: file.type,
        size: file.size,
        previewUrl: blobPreview,
        uploading: true,
        uploadProgress: 0,
      };
      onChange(placeholder);
      setError(null);

      try {
        const uploaded = await uploadReferenceToStorage({
          file,
          draftId,
          attachmentId: id,
          signal: controller.signal,
          onProgress: (percent) => {
            onChange({ ...placeholder, uploadProgress: percent });
          },
        });

        URL.revokeObjectURL(blobPreview);
        abortRef.current = null;

        onChange({
          id: uploaded.id,
          name: uploaded.name,
          type: uploaded.type,
          size: uploaded.size,
          url: uploaded.url,
          storageKey: uploaded.storageKey,
          previewUrl: uploaded.previewUrl ?? uploaded.url,
          uploadProgress: 100,
        });
      } catch (err) {
        URL.revokeObjectURL(blobPreview);
        abortRef.current = null;
        if (err instanceof UploadAbortedError) {
          onChange(null);
          return;
        }
        onChange(null);
        setError(err instanceof Error ? err.message : "Logo upload failed");
      }
    },
    [draftId, logo?.id, onChange],
  );

  const acceptLogoFile = useCallback(
    (file: File | null) => {
      if (!file || logo?.uploading) return;
      void uploadLogo(file);
    },
    [logo?.uploading, uploadLogo],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (logo?.uploading) return;

      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          'input, textarea, select, [contenteditable="true"], [role="textbox"]',
        )
      ) {
        return;
      }

      const file = imageFileFromClipboard(event.clipboardData);
      if (!file) return;

      const inLogoSection = Boolean(
        target && sectionRef.current?.contains(target),
      );
      if (!inLogoSection && logo) return;

      event.preventDefault();
      acceptLogoFile(file);
    },
    [acceptLogoFile, logo, logo?.uploading],
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const removeLogo = () => {
    abortRef.current?.abort();
    if (logo?.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(logo.previewUrl);
    }
    onChange(null);
    setError(null);
  };

  const thumb = logo ? attachmentDisplayUrl(logo) : undefined;
  const isComplete = Boolean(logo?.url) && !logo?.uploading;
  const canAcceptFiles = !logo?.uploading;

  const handleDragOver = (event: React.DragEvent) => {
    if (!canAcceptFiles) return;
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    if (
      sectionRef.current &&
      event.relatedTarget instanceof Node &&
      sectionRef.current.contains(event.relatedTarget)
    ) {
      return;
    }
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    if (!canAcceptFiles) return;
    acceptLogoFile(firstAllowedRasterImageFile(event.dataTransfer.files));
  };

  const handleLocalPaste = (event: React.ClipboardEvent) => {
    if (!canAcceptFiles) return;
    const file = imageFileFromClipboard(event.clipboardData);
    if (!file) return;
    event.preventDefault();
    acceptLogoFile(file);
  };

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handleLocalPaste}
      className={cn(
        "space-y-3 rounded-2xl border bg-surface p-4 outline-none transition-colors",
        isDragOver
          ? "border-accent bg-accent/5"
          : "border-border",
      )}
    >
      <div>
        <h3 className="text-sm font-medium text-foreground">Your logo</h3>
        <p className="mt-1 text-xs text-muted">
          Optional. Upload, paste, or drop a PNG, JPG, or WEBP — we use it as the
          brand mark across generated assets instead of generating a new logo.
        </p>
      </div>

      {logo ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
          {logo.uploading ? (
            <AttachmentUploadThumbnail
              previewUrl={thumb}
              progress={logo.uploadProgress ?? 0}
              isImage
              fileLabel="LOGO"
            />
          ) : thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              className="h-14 w-14 shrink-0 rounded-lg object-contain bg-white"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {logo.name}
            </p>
            <p className="text-xs text-muted">
              {logo.uploading
                ? (logo.uploadProgress ?? 0) >= UPLOAD_SAVING_PROGRESS
                  ? "Saving…"
                  : "Uploading…"
                : isComplete
                  ? "Used in all brand generations"
                  : ""}
            </p>
          </div>
          {logo.uploading ? (
            <button
              type="button"
              onClick={removeLogo}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-sidebar-active"
              aria-label="Cancel logo upload"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} color="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              onClick={removeLogo}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-sidebar-active hover:text-destructive"
              aria-label="Remove logo"
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} color="currentColor" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={!canAcceptFiles}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center transition-colors hover:border-accent/50 hover:bg-sidebar-active/30",
            isDragOver && "border-accent bg-accent/5",
          )}
        >
          <HugeiconsIcon
            icon={Upload04Icon}
            size={24}
            color="currentColor"
            className="text-muted"
          />
          <span className="text-sm font-medium text-foreground">
            Drop your logo, paste an image, or click to upload
          </span>
          <span className="text-xs text-muted">PNG, JPG, or WEBP</span>
        </button>
      )}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          acceptLogoFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </section>
  );
}
