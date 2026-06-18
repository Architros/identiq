"use client";

import { useCallback, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload04Icon } from "@hugeicons/core-free-icons";
import { useBrand } from "@/components/providers/brand-provider";
import { useBrandAssets } from "@/contexts/brand-assets-context";
import {
  BrandGuardedLink,
  useRequireBrand,
} from "@/contexts/require-brand-context";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_FILES,
  isAllowedAttachmentFile,
  ATTACHMENT_MAX_BYTES,
} from "@/lib/brand/attachment-utils";
import { uploadBrandReferenceToStorage } from "@/lib/storage/upload-client";
import { showErrorToast, showSuccessToast } from "@/lib/toast/show-toast";
import { cn } from "@/lib/utils";

type HomeBrandUploadDropzoneProps = {
  variant?: "card" | "wide";
  className?: string;
};

const UPLOAD_CONCURRENCY = 3;

export function HomeBrandUploadDropzone({
  variant = "card",
  className,
}: HomeBrandUploadDropzoneProps) {
  const { hasActiveBrand, activeBrand, brandKit } = useBrand();
  const { requireBrand } = useRequireBrand();
  const { brandReferences, addBrandReference } = useBrandAssets();

  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brandName = activeBrand.displayName || brandKit.displayName || "your brand";
  const remainingSlots = Math.max(0, ATTACHMENT_MAX_FILES - brandReferences.length);

  const openFilePicker = useCallback(() => {
    requireBrand({ onAllowed: () => inputRef.current?.click() });
  }, [requireBrand]);

  const startUpload = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || isUploading) return;

      if (!hasActiveBrand) {
        requireBrand();
        return;
      }

      setError(null);
      setIsUploading(true);

      const brandId = brandKit.id;
      let skippedLarge = 0;
      let skippedUnsupported = 0;

      const candidates = Array.from(files).filter((file) => {
        if (file.size > ATTACHMENT_MAX_BYTES) {
          skippedLarge += 1;
          return false;
        }
        if (!isAllowedAttachmentFile(file)) {
          skippedUnsupported += 1;
          return false;
        }
        return true;
      });

      const toUpload = candidates.slice(0, remainingSlots);
      const skippedCapacity = Math.max(0, candidates.length - toUpload.length);

      if (toUpload.length === 0) {
        setIsUploading(false);
        if (remainingSlots === 0) {
          setError(`This brand already has ${ATTACHMENT_MAX_FILES} library files.`);
        } else if (skippedLarge > 0) {
          setError("Files must be 10MB or smaller.");
        } else {
          setError("No supported files selected.");
        }
        return;
      }

      try {
        let uploadedCount = 0;
        let failed = 0;

        for (let i = 0; i < toUpload.length; i += UPLOAD_CONCURRENCY) {
          const chunk = toUpload.slice(i, i + UPLOAD_CONCURRENCY);
          await Promise.all(
            chunk.map(async (file) => {
              const referenceId = `ref_${crypto.randomUUID().slice(0, 8)}`;
              try {
                const uploaded = await uploadBrandReferenceToStorage({
                  file,
                  brandId,
                  referenceId,
                });
                addBrandReference({
                  id: referenceId,
                  brandId,
                  name: file.name,
                  type: file.type || "application/octet-stream",
                  url: uploaded.url,
                  source: "ideas",
                  createdAt: new Date().toISOString(),
                });
                uploadedCount += 1;
              } catch {
                failed += 1;
              }
            }),
          );
        }

        if (uploadedCount === 0) {
          showErrorToast("Upload failed. Check your connection and try again.", {
            title: "Upload failed",
            mapAsGeneration: false,
          });
          setError("Upload failed. Please try again.");
          return;
        }

        const parts: string[] = [];
        if (skippedLarge > 0) {
          parts.push(`${skippedLarge} over 10MB skipped`);
        }
        if (skippedUnsupported > 0) {
          parts.push(`${skippedUnsupported} unsupported skipped`);
        }
        if (skippedCapacity > 0) {
          parts.push(`${skippedCapacity} skipped (max ${ATTACHMENT_MAX_FILES} per brand)`);
        }
        if (failed > 0) {
          parts.push(`${failed} failed`);
        }

        showSuccessToast(
          parts.length > 0
            ? `${uploadedCount} file${uploadedCount === 1 ? "" : "s"} added to ${brandName}. ${parts.join(" · ")}.`
            : `${uploadedCount} file${uploadedCount === 1 ? "" : "s"} added to ${brandName}'s library.`,
          {
            title: "Uploaded to brand library",
            dedupeKey: "home-brand-upload-success",
          },
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : "Upload failed";
        setError(message);
        showErrorToast(message, {
          title: "Upload failed",
          mapAsGeneration: false,
        });
      } finally {
        setIsUploading(false);
      }
    },
    [
      isUploading,
      hasActiveBrand,
      requireBrand,
      brandKit.id,
      remainingSlots,
      addBrandReference,
      brandName,
    ],
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
        disabled={isUploading}
        onClick={openFilePicker}
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
          {isUploading
            ? "Uploading…"
            : hasActiveBrand
              ? `Upload to ${brandName}`
              : "Drop files or click to upload"}
        </span>
        <span className="max-w-[14rem] text-[10px] leading-snug text-muted">
          {hasActiveBrand
            ? `PNG, JPG, WEBP, TXT, MD — ${remainingSlots} slot${remainingSlots === 1 ? "" : "s"} left`
            : `PNG, JPG, WEBP, TXT, MD — up to ${ATTACHMENT_MAX_FILES} files`}
        </span>
      </button>

      {error ? (
        <p
          className="mt-1.5 text-center text-[10px] text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {hasActiveBrand ? (
        <p className="mt-1.5 text-center text-[10px] text-muted">
          Files appear under{" "}
          <BrandGuardedLink
            href="/images"
            className="font-medium text-accent hover:underline"
          >
            Brand assets
          </BrandGuardedLink>
          .
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        multiple
        className="hidden"
        disabled={isUploading}
        onChange={(e) => {
          void startUpload(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
