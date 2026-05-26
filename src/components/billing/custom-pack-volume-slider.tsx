"use client";

import { useCallback, useMemo, type CSSProperties } from "react";
import { CUSTOM_PACK_TIERS } from "@/lib/billing/custom-pack-pricing";
import type { ScaleTier } from "@/lib/billing/scale-tiers";
import { cn } from "@/lib/utils";

type CustomPackVolumeSliderProps = {
  tierIndex: number;
  onTierIndexChange: (index: number) => void;
  tiers?: ScaleTier[];
  className?: string;
};

function tierProgressPercent(index: number, maxIndex: number): number {
  if (maxIndex <= 0) return 0;
  return (index / maxIndex) * 100;
}

export function CustomPackVolumeSlider({
  tierIndex,
  onTierIndexChange,
  tiers: tiersProp,
  className,
}: CustomPackVolumeSliderProps) {
  const tiers = tiersProp?.length ? tiersProp : scaleRowsFromCatalog();
  const maxIndex = Math.max(0, tiers.length - 1);
  const safeIndex = Math.min(Math.max(0, tierIndex), maxIndex);
  const fillPercent = tierProgressPercent(safeIndex, maxIndex);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onTierIndexChange(Number(e.target.value));
    },
    [onTierIndexChange],
  );

  const marks = useMemo(
    () => tiers.map((t) => t.monthlyTokens),
    [tiers],
  );

  return (
    <div className={cn("w-full", className)}>
      <div className="relative px-1 pt-2 pb-2">
        {/* Progress track (accent fill) */}
        <div
          className="pointer-events-none absolute inset-x-1 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-border"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200 ease-out"
            style={{ width: `${fillPercent}%` }}
          />
        </div>

        {/* Step markers on the track */}
        <div
          className="pointer-events-none absolute inset-x-1 top-1/2 h-2 -translate-y-1/2"
          aria-hidden
        >
          {marks.map((_, i) => {
            const left = tierProgressPercent(i, maxIndex);
            const reached = i <= safeIndex;
            const active = i === safeIndex;

            return (
              <span
                key={i}
                className={cn(
                  "absolute top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-200",
                  reached
                    ? "border-accent bg-accent"
                    : "border-border bg-surface",
                  active ? "size-3 ring-[3px] ring-accent/25" : "size-2",
                )}
                style={{ left: `${left}%` }}
              />
            );
          })}
        </div>

        <input
          type="range"
          min={0}
          max={maxIndex}
          step={1}
          value={safeIndex}
          onChange={handleChange}
          aria-label="Token pack size"
          aria-valuemin={marks[0]}
          aria-valuemax={marks[maxIndex]}
          aria-valuenow={marks[safeIndex]}
          aria-valuetext={`${marks[safeIndex].toLocaleString()} tokens`}
          className="custom-pack-slider relative z-10 h-6 w-full cursor-pointer appearance-none bg-transparent"
          style={
            {
              "--slider-fill": `${fillPercent}%`,
            } as CSSProperties
          }
        />
      </div>

      {/* Clickable tier benchmarks */}
      <div className="mt-1 flex justify-between gap-1">
        {marks.map((mark, i) => {
          const active = i === safeIndex;
          const reached = i <= safeIndex;

          return (
            <button
              key={mark}
              type="button"
              onClick={() => onTierIndexChange(i)}
              aria-label={`${mark.toLocaleString()} tokens per month`}
              aria-pressed={active}
              className={cn(
                "group flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-1.5 rounded-md px-0.5 py-1 transition-colors",
                "hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
              )}
            >
              <span
                className={cn(
                  "block size-2 rounded-full border-2 transition-all duration-200 sm:hidden",
                  reached
                    ? "border-accent bg-accent"
                    : "border-border bg-surface group-hover:border-accent/60",
                  active && "size-2.5 ring-2 ring-accent/25",
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "text-center text-[11px] font-medium tabular-nums transition-colors",
                  active
                    ? "font-semibold text-accent"
                    : reached
                      ? "text-foreground"
                      : "text-muted group-hover:text-foreground",
                )}
              >
                {mark.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function scaleRowsFromCatalog(): ScaleTier[] {
  return CUSTOM_PACK_TIERS.map((t) => ({
    monthlyTokens: t.monthlyTokens,
    monthlyPriceCents: t.monthlyPriceCents,
    annualPriceCents: t.monthlyPriceCents * 10,
  }));
}
