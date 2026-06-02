"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Download04Icon,
  Image01Icon,
} from "@hugeicons/core-free-icons";
import { downloadImageUrl } from "@/lib/download/fetch-image-blob";
import { cn } from "@/lib/utils";

export type LightboxImage = {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  /** Defaults to a sanitized alt-based name when omitted. */
  downloadFilename?: string;
  libraryHref?: string;
  libraryLabel?: string;
  onLibraryNavigate?: () => void;
};

type ImageLightboxModalProps = {
  image: LightboxImage | null;
  onClose: () => void;
};

export function ImageLightboxModal({ image, onClose }: ImageLightboxModalProps) {
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!image) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [image, onClose]);

  useEffect(() => {
    if (!image) setDownloading(false);
  }, [image]);

  const handleDownload = useCallback(async () => {
    if (!image) return;
    const safeName =
      image.downloadFilename?.trim() ||
      `${image.alt.replace(/[^\w.-]+/g, "_").slice(0, 80) || "asset"}.png`;
    setDownloading(true);
    try {
      await downloadImageUrl(image.src, safeName);
    } catch {
      window.open(image.src, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  }, [image]);

  if (!image) return null;

  const libraryHref = image.libraryHref?.trim();
  const libraryLabel = image.libraryLabel?.trim() || "Brand assets";

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
        aria-label={image.alt}
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {image.title ?? image.alt}
            </p>
            {image.subtitle ? (
              <p className="truncate text-xs text-muted">{image.subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-sidebar-active hover:text-foreground"
            aria-label="Close"
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.src}
            alt={image.alt}
            className="max-h-[70vh] max-w-full rounded-lg object-contain"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3">
          {libraryHref ? (
            <Link
              href={libraryHref}
              onClick={() => {
                image.onLibraryNavigate?.();
                onClose();
              }}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors",
                "hover:bg-sidebar-active",
              )}
            >
              <HugeiconsIcon
                icon={Image01Icon}
                size={16}
                color="currentColor"
                strokeWidth={1.75}
              />
              {libraryLabel}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloading}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors",
              "hover:bg-sidebar-active disabled:cursor-wait disabled:opacity-60",
            )}
          >
            <HugeiconsIcon
              icon={Download04Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
            />
            {downloading ? "Downloading…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
