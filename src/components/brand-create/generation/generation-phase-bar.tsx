"use client";

import { motion } from "framer-motion";
import type { CreateStreamPhase } from "@/lib/brand/create-stream-types";
import { cn } from "@/lib/utils";

const PHASES: { id: CreateStreamPhase | "idle"; label: string }[] = [
  { id: "orchestrating", label: "Brand system" },
  { id: "planning", label: "Asset plan" },
  { id: "generating", label: "Images" },
  { id: "done", label: "Done" },
];

function phaseIndex(phase: CreateStreamPhase | undefined): number {
  if (!phase || phase === "error" || phase === "stopped") return -1;
  return PHASES.findIndex((p) => p.id === phase);
}

type GenerationPhaseBarProps = {
  phase?: CreateStreamPhase;
  savedCount: number;
  totalCount: number;
  isActive: boolean;
};

export function GenerationPhaseBar({
  phase,
  savedCount,
  totalCount,
  isActive,
}: GenerationPhaseBarProps) {
  const current = phaseIndex(phase);
  const progressPercent =
    totalCount > 0 ? Math.round((savedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">
          {isActive ? "Generation in progress" : "Generation"}
        </span>
        {totalCount > 0 ? (
          <span className="text-xs text-muted tabular-nums">
            {savedCount}/{totalCount} saved ({progressPercent}%)
          </span>
        ) : null}
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-sidebar-active">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <ol className="flex flex-wrap gap-2">
        {PHASES.filter((p) => p.id !== "done").map((step, index) => {
          const done = current > index;
          const active = current === index && isActive;
          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                done && "bg-emerald-500/15 text-emerald-700",
                active && "bg-accent/15 text-accent",
                !done && !active && "bg-sidebar-active text-muted",
              )}
            >
              {active ? (
                <span className="generation-spinner h-3 w-3 rounded-full border-2 border-accent/30 border-t-accent" />
              ) : done ? (
                <span className="text-[10px]">✓</span>
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-muted/50" />
              )}
              {step.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
