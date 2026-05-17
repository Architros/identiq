"use client";

import { useBrand } from "@/components/providers/brand-provider";
import { useGeneration } from "@/contexts/generation-context";
import { resolveFeelingLabels } from "@/lib/brand/visual-inspiration";

/** Shows brand personality tags when Ideas has no reference images uploaded. */
export function DockInspirationTags() {
  const { brandKit } = useBrand();
  const { referenceImages } = useGeneration();

  if (referenceImages.length > 0) return null;

  const labels = resolveFeelingLabels(brandKit.feelings ?? []);
  if (labels.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-4 pb-1">
      <span className="text-[11px] text-muted">Visual inspiration:</span>
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-full border border-accent/30 bg-accent/[0.06] px-2 py-0.5 text-[11px] font-medium text-accent"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
