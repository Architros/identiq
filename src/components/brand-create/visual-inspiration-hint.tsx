"use client";

import { BRAND_FEELINGS } from "@/lib/brand/brand-project-draft";
import { cn } from "@/lib/utils";

type VisualInspirationHintProps = {
  feelingIds: string[];
  hasReferenceImages: boolean;
  className?: string;
};

export function VisualInspirationHint({
  feelingIds,
  hasReferenceImages,
  className,
}: VisualInspirationHintProps) {
  if (hasReferenceImages) {
    return (
      <p
        className={cn(
          "rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted",
          className,
        )}
      >
        Reference images will be the primary visual guide for generation.
        Personality tags still shape tone and copy direction.
      </p>
    );
  }

  const labels = feelingIds
    .map((id) => BRAND_FEELINGS.find((f) => f.id === id)?.label ?? id)
    .filter(Boolean);

  if (labels.length === 0) {
    return (
      <p
        className={cn(
          "rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-sm text-foreground",
          className,
        )}
      >
        No reference images yet. Pick up to 3 personality tags in the
        &ldquo;Feeling&rdquo; step — they become visual inspiration when you
        don&apos;t upload brand references here.
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm text-muted">
        No reference images — these personality tags will guide colors, lighting,
        and composition:
      </p>
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => (
          <span
            key={label}
            className="rounded-full border border-accent/40 bg-accent/[0.08] px-2.5 py-0.5 text-xs font-medium text-accent"
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
