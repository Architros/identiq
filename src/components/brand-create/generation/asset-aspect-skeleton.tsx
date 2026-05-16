"use client";

import {
  aspectRatioGenerationWrapperClass,
  aspectRatioPanelWrapperClass,
  parseAspectRatio,
} from "@/lib/generation/aspect-ratio-styles";
import { cn } from "@/lib/utils";

type AssetAspectSkeletonProps = {
  aspectRatio: string;
  active?: boolean;
  label?: string;
  className?: string;
  size?: "panel" | "generation";
};

export function AssetAspectSkeleton({
  aspectRatio,
  active = false,
  label,
  className,
  size = "panel",
}: AssetAspectSkeletonProps) {
  const ratio = parseAspectRatio(aspectRatio);
  const wrapperClass =
    size === "generation"
      ? aspectRatioGenerationWrapperClass(ratio)
      : aspectRatioPanelWrapperClass(ratio);

  return (
    <div
      className={cn(
        wrapperClass,
        size === "panel" && "border border-border/80",
        "overflow-hidden rounded-xl bg-sidebar-active",
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0">
        <div
          className={cn(
            "absolute inset-0",
            active
              ? "animate-pulse bg-gradient-to-br from-sidebar-active via-accent/10 to-sidebar-active"
              : "bg-sidebar-active",
          )}
        />
        {active ? (
          <div className="generation-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-accent/25 to-transparent" />
        ) : null}
      </div>

      {label ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
          {active ? (
            <span className="generation-spinner h-5 w-5 rounded-full border-2 border-accent/30 border-t-accent" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-muted/40" />
          )}
          <span className="text-center text-[10px] font-medium uppercase tracking-wide text-muted">
            {label}
          </span>
        </div>
      ) : null}
    </div>
  );
}
