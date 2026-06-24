"use client";

import type { AspectRatio } from "@/lib/generation/presets";
import {
  aspectRatioCSSValue,
  imagesLibraryCardGridClass,
} from "@/lib/generation/aspect-ratio-styles";
import { cn } from "@/lib/utils";

type AssetGridSkeletonProps = {
  count?: number;
  ratio?: AspectRatio;
};

export function AssetGridSkeleton({
  count = 8,
  ratio = "4:5",
}: AssetGridSkeletonProps) {
  return (
    <div className={imagesLibraryCardGridClass()}>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={cn(
            "relative overflow-hidden rounded-lg border border-border/30 bg-muted/20",
            "animate-pulse bg-gradient-to-br from-border/50 via-muted/40 to-border/50",
          )}
          style={{ aspectRatio: aspectRatioCSSValue(ratio) }}
          aria-hidden
        />
      ))}
    </div>
  );
}
