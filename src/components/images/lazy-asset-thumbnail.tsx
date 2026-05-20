"use client";

import { useCallback, useState } from "react";
import type { AspectRatio } from "@/lib/generation/presets";
import {
  aspectRatioCSSValue,
  aspectRatioGalleryMaxWidthClass,
} from "@/lib/generation/aspect-ratio-styles";
import { cn } from "@/lib/utils";

type LoadStatus = "idle" | "loading" | "loaded" | "error";

export type LazyAssetThumbnailProps = {
  src: string;
  alt: string;
  /** Layout box matches gallery aspect so slow loads do not jump layout */
  ratio: AspectRatio;
  /** First visible tiles only — rest use lazy + low fetch priority */
  priority?: boolean;
  /** `card` uses smaller max widths for the library grid. */
  size?: "gallery" | "card";
  /** Library cards use cover to fill the tile; gallery keeps contain. */
  fit?: "contain" | "cover";
  className?: string;
  imgClassName?: string;
};

function bustCacheUrl(src: string, retryKey: number): string {
  if (retryKey === 0) return src;
  const sep = src.includes("?") ? "&" : "?";
  return `${src}${sep}_retry=${retryKey}`;
}

/**
 * Thumbnail for Brand assets: skeleton until decode, lazy by default,
 * object-contain inside a fixed aspect box for slow connections.
 */
export function LazyAssetThumbnail({
  src,
  alt,
  ratio,
  priority = false,
  size = "gallery",
  fit,
  className,
  imgClassName,
}: LazyAssetThumbnailProps) {
  const objectFit = fit ?? (size === "card" ? "cover" : "contain");
  const maxWidthClass =
    size === "card"
      ? "w-full"
      : aspectRatioGalleryMaxWidthClass[ratio];
  const [status, setStatus] = useState<LoadStatus>(() =>
    src.trim() ? "loading" : "error",
  );
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = useCallback(() => {
    if (!src.trim()) return;
    setRetryKey((k) => k + 1);
    setStatus("loading");
  }, [src]);

  const resolvedSrc = bustCacheUrl(src, retryKey);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-lg border border-border/30 bg-muted/20",
        maxWidthClass,
        className,
      )}
      style={{ aspectRatio: aspectRatioCSSValue(ratio) }}
    >
      {status === "loading" ? (
        <div
          aria-hidden
          className="absolute inset-0 z-0 animate-pulse bg-gradient-to-br from-border/50 via-muted/40 to-border/50"
        />
      ) : null}

      {status === "error" ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-surface/95 px-3 text-center">
          <p className="text-xs font-medium text-foreground">Couldn&apos;t load</p>
          <p className="text-[11px] leading-snug text-muted">
            Check your connection, then retry.
          </p>
          {src.trim() ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRetry();
              }}
              className="cursor-pointer rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
            >
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      {src.trim() && status !== "error" ? (
        <img
          key={resolvedSrc}
          src={resolvedSrc}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
          sizes={
            size === "card"
              ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
              : "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 320px"
          }
          className={cn(
            "relative z-10 h-full w-full transition-opacity duration-300 ease-out",
            objectFit === "cover" ? "object-cover" : "object-contain",
            status === "loaded" ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
        />
      ) : null}
    </div>
  );
}
