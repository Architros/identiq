"use client";

import type { AssetProgressData } from "@/lib/brand/create-stream-types";
import { GENERATION_STATUS_LABEL } from "@/lib/brand/generation-status-labels";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<AssetProgressData["status"], string> = {
  queued: "bg-muted/50",
  generating: "bg-accent animate-pulse",
  uploading: "bg-accent animate-pulse",
  saved: "bg-emerald-500",
  error: "bg-red-500",
};

type GenerationActivityListProps = {
  items: AssetProgressData[];
  className?: string;
};

export function GenerationActivityList({
  items,
  className,
}: GenerationActivityListProps) {
  const inFlight = items.filter((i) => i.status !== "saved");

  if (inFlight.length === 0) return null;

  return (
    <ul
      className={cn(
        "max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border bg-surface/80 p-3",
        className,
      )}
      aria-label="Asset generation activity"
    >
      {inFlight.map((item) => (
        <li
          key={item.itemId}
          className="flex items-center gap-2 text-xs text-foreground"
        >
          <span
            className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[item.status])}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate">{item.title}</span>
          <span
            className={cn(
              "shrink-0 tabular-nums",
              item.status === "error" ? "text-red-600" : "text-muted",
            )}
          >
            {GENERATION_STATUS_LABEL[item.status]}
          </span>
        </li>
      ))}
    </ul>
  );
}
