"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowReloadHorizontalIcon } from "@hugeicons/core-free-icons";
import { AITextLoading } from "@/components/ui/ai-text-loading";
import { useGenerationElapsed } from "@/hooks/use-generation-elapsed";
import {
  aspectRatioCSSValue,
  aspectRatioGenerationCenteredTileClass,
  aspectRatioGenerationLeftWrapperClass,
  parseAspectRatio,
} from "@/lib/generation/aspect-ratio-styles";
import type { AspectRatio } from "@/lib/generation/presets";
import { cn } from "@/lib/utils";

function skeletonSizeClass(ratio: AspectRatio, centered: boolean): string {
  const compactSize: Record<AspectRatio, string> = {
    "1:1": centered
      ? "w-[min(100%,260px)] max-w-[260px]"
      : "w-full max-w-[min(100%,260px)]",
    "9:16": centered
      ? "w-[min(100%,170px)] max-w-[170px]"
      : "w-full max-w-[min(100%,170px)]",
    "16:9": centered
      ? "w-[min(100%,360px)] max-w-[360px]"
      : "w-full max-w-[min(100%,360px)]",
    "4:5": centered
      ? "w-[min(100%,220px)] max-w-[220px]"
      : "w-full max-w-[min(100%,220px)]",
    "2:3": centered
      ? "w-[min(100%,200px)] max-w-[200px]"
      : "w-full max-w-[min(100%,200px)]",
    "21:9": centered
      ? "w-[min(100%,420px)] max-w-[420px]"
      : "w-full max-w-[min(100%,420px)]",
  };
  return compactSize[ratio];
}

type ImageSkeletonGridProps = {
  aspectRatio: string;
  quantity: number;
  mediaTypeLabel?: string;
  remixPreviewUrl?: string;
  imageModel?: string;
  displayDimensions?: string;
  elapsedStartedAt?: number | null;
  /** Rotating status lines shown while rendering. */
  progressTexts?: string[];
  /** @deprecated Use progressTexts */
  activityLabel?: string;
  /** When false, skeleton is static (e.g. after a failed generation). */
  animated?: boolean;
  failed?: boolean;
  onRetry?: () => void;
  /** Center skeleton tiles (library remix welcome layout). */
  centered?: boolean;
};

export function ImageSkeletonGrid({
  aspectRatio,
  quantity,
  mediaTypeLabel,
  remixPreviewUrl,
  displayDimensions,
  elapsedStartedAt = null,
  progressTexts,
  activityLabel,
  animated = true,
  failed = false,
  onRetry,
  centered = false,
}: ImageSkeletonGridProps) {
  const ratio = parseAspectRatio(aspectRatio);
  const count = Math.max(1, Math.min(quantity, 4));
  const elapsed = useGenerationElapsed(failed ? null : elapsedStartedAt);

  const statusTexts =
    progressTexts ??
    (activityLabel ? [activityLabel] : undefined) ?? [
      "Creating image…",
      "Applying brand style…",
      "Enhancing details…",
      "Almost done…",
    ];

  const showProgressOverlay = animated && !failed;

  const progressOverlay = (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 px-4 text-center">
      <AITextLoading
        texts={statusTexts}
        size="sm"
        compact
        interval={1500}
        className="justify-center"
      />
      {displayDimensions || elapsed ? (
        <p className="text-xs text-muted">
          {displayDimensions ? `${displayDimensions}` : null}
          {displayDimensions && elapsed ? " · " : null}
          {elapsed ? `${elapsed}` : null}
        </p>
      ) : null}
    </div>
  );

  return (
    <div className={cn("w-full space-y-2", centered && "text-center")}>
      {remixPreviewUrl && !centered ? (
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex w-full flex-col gap-3",
              "min-w-0 flex-1 items-start",
            )}
          >
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  aspectRatioGenerationLeftWrapperClass(ratio),
                  skeletonSizeClass(ratio, centered),
                  "relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-sidebar-active via-border/30 to-sidebar-active",
                  animated && !failed && "animate-pulse",
                  failed && "opacity-70",
                )}
                style={{ aspectRatio: aspectRatioCSSValue(ratio) }}
              >
                {showProgressOverlay && i === 0 ? progressOverlay : null}
                {failed && onRetry && i === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/40">
                    <button
                      type="button"
                      onClick={onRetry}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-sidebar-active"
                    >
                      <HugeiconsIcon
                        icon={ArrowReloadHorizontalIcon}
                        size={18}
                        color="currentColor"
                        strokeWidth={1.75}
                      />
                      Retry
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
            <div
              className="relative w-[88px] overflow-hidden rounded-lg border border-border/70 bg-surface shadow-sm"
              style={{ aspectRatio: aspectRatioCSSValue(ratio) }}
            >
              <Image
                src={remixPreviewUrl}
                alt="Remix template"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <span className="max-w-[88px] text-center text-[10px] font-medium leading-tight text-muted">
              Remix source
            </span>
          </div>
        </div>
      ) : (
        <>
          {remixPreviewUrl ? (
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-border/70 bg-surface px-2 py-1",
                centered ? "mx-auto" : "mx-0",
              )}
            >
              <div className="relative h-8 w-8 overflow-hidden rounded-md border border-border/70 bg-sidebar-active">
                <Image
                  src={remixPreviewUrl}
                  alt="Remix source"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <span className="text-[11px] font-medium text-muted">Remix source</span>
            </div>
          ) : null}

          <div
            className={cn(
              "flex w-full flex-col gap-3",
              centered ? "items-center" : "items-start",
            )}
          >
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  centered
                    ? aspectRatioGenerationCenteredTileClass(ratio)
                    : aspectRatioGenerationLeftWrapperClass(ratio),
                  skeletonSizeClass(ratio, centered),
                  "relative overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-sidebar-active via-border/30 to-sidebar-active",
                  animated && !failed && "animate-pulse",
                  failed && "opacity-70",
                )}
                style={{ aspectRatio: aspectRatioCSSValue(ratio) }}
              >
                {showProgressOverlay && i === 0 ? progressOverlay : null}
                {failed && onRetry && i === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/40">
                    <button
                      type="button"
                      onClick={onRetry}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-sidebar-active"
                    >
                      <HugeiconsIcon
                        icon={ArrowReloadHorizontalIcon}
                        size={18}
                        color="currentColor"
                        strokeWidth={1.75}
                      />
                      Retry
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </>
      )}
      {mediaTypeLabel ? (
        <div
          className={cn(
            "inline-flex w-fit items-center rounded-full border border-border/70 bg-surface px-2.5 py-1 text-[11px] font-medium text-muted",
            centered ? "mx-auto" : "mx-0",
          )}
        >
          {mediaTypeLabel}
        </div>
      ) : null}
    </div>
  );
}
