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
    <div
      role="group"
      aria-label="Pack size"
      className="inline-flex rounded-full border border-border bg-background p-1"
    >
      {(
        [
          ["monthly", "Monthly"],
          ["annual", "Annual"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "cursor-pointer rounded-full px-5 py-2 text-sm font-medium transition-colors",
            value === id
              ? "bg-accent text-white shadow-sm"
              : "text-muted hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
