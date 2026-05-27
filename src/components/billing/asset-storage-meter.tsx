"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Folder01Icon } from "@hugeicons/core-free-icons";
import { formatStoredAssetsLimit } from "@/lib/billing/storage-entitlement";
import { cn } from "@/lib/utils";

type AssetStorageMeterProps = {
  used: number;
  limit: number;
  /** Compact single line under token balance. */
  variant?: "inline" | "feature";
  className?: string;
};

export function AssetStorageMeter({
  used,
  limit,
  variant = "inline",
  className,
}: AssetStorageMeterProps) {
  const remaining = Math.max(0, limit - used);
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  if (variant === "feature") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 text-sm text-foreground/70",
          className,
        )}
      >
        <HugeiconsIcon
          icon={Folder01Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.75}
          className="shrink-0 text-accent"
        />
        {formatStoredAssetsLimit(limit)}
      </span>
    );
  }

  return (
    <div className={cn("mt-3", className)}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <HugeiconsIcon
            icon={Folder01Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.75}
            className="shrink-0 text-accent"
          />
          Asset library
        </span>
        <span className="tabular-nums text-muted">
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={`${used} of ${limit} saved assets`}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {remaining.toLocaleString()} slot{remaining === 1 ? "" : "s"} remaining
        · saves count toward your pack limit
      </p>
    </div>
  );
}

export function isStoredAssetsFeatureLine(feature: string): boolean {
  return /stored assets/i.test(feature);
}
