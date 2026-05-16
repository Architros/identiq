"use client";

import { cn } from "@/lib/utils";

type GenerationShimmerProps = {
  className?: string;
  label?: string;
};

export function GenerationShimmer({ className, label }: GenerationShimmerProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden bg-sidebar-active",
        className,
      )}
    >
      <div className="generation-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      {label ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span className="generation-spinner h-5 w-5 rounded-full border-2 border-accent/30 border-t-accent" />
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
            {label}
          </span>
        </div>
      ) : null}
    </div>
  );
}
