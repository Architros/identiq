"use client";

import { cn } from "@/lib/utils";
import type { AspectRatio } from "@/lib/generation/presets";

const aspectClass: Record<AspectRatio, string> = {
  "1:1": "aspect-square max-w-sm",
  "9:16": "aspect-[9/16] max-w-[220px]",
  "16:9": "aspect-video max-w-xl",
  "4:5": "aspect-[4/5] max-w-[280px]",
};

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
};

export function ImageSkeletonGrid({
  aspectRatio,
  quantity,
  imageModel,
}: ImageSkeletonGridProps) {
  const ratio = (aspectRatio in aspectClass
    ? aspectRatio
    : "16:9") as AspectRatio;
  const count = Math.max(1, Math.min(quantity, 4));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">
        Creating image with {formatImageModelLabel(imageModel)}…
      </p>
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-full animate-pulse overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-sidebar-active via-border/30 to-sidebar-active",
              aspectClass[ratio],
            )}
          />
        ))}
      </div>
    </div>
  );
}
