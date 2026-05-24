"use client";

import { useCallback, useRef, useState } from "react";
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
import { isAllowedRasterImageType } from "@/lib/brand/attachment-utils";
import { cn } from "@/lib/utils";

type LogoUploadProps = {
  draftId: string;
  logo: BrandAttachment | null | undefined;
  onChange: (logo: BrandAttachment | null) => void;
};

export function LogoUpload({ draftId, logo, onChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div>
        <h3 className="text-sm font-medium text-foreground">Your logo</h3>
        <p className="mt-1 text-xs text-muted">
          Optional. If you upload a logo, we use it as the brand mark and apply it
          across generated assets instead of generating a new logo.
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
          disabled={false}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-6 text-center transition-colors hover:border-accent/50 hover:bg-sidebar-active/30",
          )}
        >
          <HugeiconsIcon
            icon={Upload04Icon}
            size={24}
            color="currentColor"
            className="text-muted"
          />
          <span className="text-sm font-medium text-foreground">
            Upload your logo
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
          const file = e.target.files?.[0];
          if (file) void uploadLogo(file);
          e.target.value = "";
        }}
      />
    </section>
  );
}
