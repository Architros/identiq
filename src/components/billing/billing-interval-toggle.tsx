"use client";

import { cn } from "@/lib/utils";
import type { BillingInterval } from "@/lib/billing/plan-catalog";

type BillingIntervalToggleProps = {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
};

export function BillingIntervalToggle({
  value,
  onChange,
}: BillingIntervalToggleProps) {
  return (
    <div className="relative flex flex-col items-center gap-2">
      <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
        2 months free on annual packs
      </span>
      <div
        role="group"
        aria-label="Pack size"
        className="inline-flex rounded-full border border-border bg-surface p-1"
      >
        {(
          [
            ["monthly", "Monthly pack"],
            ["annual", "Annual pack"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              "cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-colors",
              value === id
                ? "bg-surface text-foreground shadow-sm ring-1 ring-border"
                : "text-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
