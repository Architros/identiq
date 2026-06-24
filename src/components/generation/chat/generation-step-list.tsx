"use client";

import type { GenerationPhase } from "@/lib/generation/chat-message-types";
import { cn } from "@/lib/utils";

const PHASE_ORDER: GenerationPhase[] = [
  "orchestrating",
  "generating-image",
  "finalizing-asset",
];

const PHASE_LABELS: Record<string, string> = {
  orchestrating: "Prompt",
  "generating-image": "Render",
  "finalizing-asset": "Finalize",
};

type GenerationStepListProps = {
  phase?: GenerationPhase | string | null;
  className?: string;
};

function phaseIndex(phase?: GenerationPhase | string | null): number {
  if (!phase) return -1;
  if (phase === "composing-prompt") return 0;
  return PHASE_ORDER.indexOf(phase as GenerationPhase);
}

export function GenerationStepList({ phase, className }: GenerationStepListProps) {
  const activeIndex = phaseIndex(phase);
  if (activeIndex < 0) return null;

  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-2 text-[11px] text-muted",
        className,
      )}
      aria-label="Generation progress"
    >
      {PHASE_ORDER.map((step, index) => {
        const done = activeIndex > index;
        const active = activeIndex === index;
        return (
          <li key={step} className="inline-flex items-center gap-1">
            <span
              className={cn(
                "inline-flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-semibold",
                done && "border-accent/40 bg-accent/10 text-accent",
                active && "border-accent bg-accent/15 text-foreground",
                !done && !active && "border-border/70 bg-surface",
              )}
              aria-hidden
            >
              {done ? "✓" : index + 1}
            </span>
            <span className={cn(active && "text-foreground")}>
              {PHASE_LABELS[step]}
            </span>
            {index < PHASE_ORDER.length - 1 ? (
              <span className="text-border" aria-hidden>
                →
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
