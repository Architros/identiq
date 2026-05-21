"use client";

import { useGenerationElapsed } from "@/hooks/use-generation-elapsed";
import {
  aspectRatioCSSValue,
  aspectRatioGenerationLeftWrapperClass,
  parseAspectRatio,
} from "@/lib/generation/aspect-ratio-styles";

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
};

export function ImageSkeletonGrid({
  aspectRatio,
  quantity,
  imageModel,
  displayDimensions,
  elapsedStartedAt = null,
  activityLabel,
}: ImageSkeletonGridProps) {
  const ratio = parseAspectRatio(aspectRatio);
  const count = Math.max(1, Math.min(quantity, 4));
  const elapsed = useGenerationElapsed(elapsedStartedAt);

  return (
    <div className="space-y-2">
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
      <div className="flex flex-col items-start gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`${aspectRatioGenerationLeftWrapperClass(ratio)} animate-pulse overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-sidebar-active via-border/30 to-sidebar-active`}
            style={{ aspectRatio: aspectRatioCSSValue(ratio) }}
          />
        ))}
      </div>
    </div>
  );
}
