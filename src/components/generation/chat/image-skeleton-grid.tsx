"use client";

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

function formatImageModelLabel(modelId?: string): string {
  if (!modelId) return "GPT Image 2";
  if (modelId.includes("gpt-5.4-image")) return "GPT-5.4 Image 2";
  if (modelId.includes("gpt-image")) return "GPT Image 2";
  return modelId.split("/").pop() ?? modelId;
}

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
  imageModel,
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
      `Creating image with ${formatImageModelLabel(imageModel)}…`,
      "Applying brand style…",
      "Enhancing details…",
      "Almost done…",
    ];

  return (
    <div className={cn("w-full space-y-2", centered && "text-center")}>
      {!failed ? (
        <div className="space-y-1">
          <AITextLoading
            texts={statusTexts}
            size="sm"
            compact
            interval={1500}
          />
          <p className="text-xs text-muted">
            {displayDimensions ? `${displayDimensions} · ` : null}
            {formatImageModelLabel(imageModel)}
            {elapsed ? ` · ${elapsed}` : null}
          </p>
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
    </div>
  );
}
