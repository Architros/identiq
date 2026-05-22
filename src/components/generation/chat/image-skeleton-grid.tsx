"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowReloadHorizontalIcon } from "@hugeicons/core-free-icons";
import { useGenerationElapsed } from "@/hooks/use-generation-elapsed";
import {
  aspectRatioCSSValue,
  aspectRatioGenerationLeftWrapperClass,
  parseAspectRatio,
} from "@/lib/generation/aspect-ratio-styles";
import { cn } from "@/lib/utils";

function formatImageModelLabel(modelId?: string): string {
  if (!modelId) return "GPT Image 2";
  if (modelId.includes("gpt-5.4-image")) return "GPT-5.4 Image 2";
  if (modelId.includes("gpt-image")) return "GPT Image 2";
  return modelId.split("/").pop() ?? modelId;
}

type ImageSkeletonGridProps = {
  aspectRatio: string;
  quantity: number;
  imageModel?: string;
  displayDimensions?: string;
  elapsedStartedAt?: number | null;
  activityLabel?: string;
  /** When false, skeleton is static (e.g. after a failed generation). */
  animated?: boolean;
  failed?: boolean;
  onRetry?: () => void;
};

export function ImageSkeletonGrid({
  aspectRatio,
  quantity,
  imageModel,
  displayDimensions,
  elapsedStartedAt = null,
  activityLabel,
  animated = true,
  failed = false,
  onRetry,
}: ImageSkeletonGridProps) {
  const ratio = parseAspectRatio(aspectRatio);
  const count = Math.max(1, Math.min(quantity, 4));
  const elapsed = useGenerationElapsed(failed ? null : elapsedStartedAt);

  return (
    <div className="space-y-2">
      {!failed ? (
        <div>
          <p className="text-sm font-medium text-foreground">
            {activityLabel ??
              `Creating image with ${formatImageModelLabel(imageModel)}…`}
          </p>
          <p className="text-xs text-muted">
            {displayDimensions ? `${displayDimensions} · ` : null}
            {formatImageModelLabel(imageModel)}
            {elapsed ? ` · ${elapsed}` : null}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col items-start gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              aspectRatioGenerationLeftWrapperClass(ratio),
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
