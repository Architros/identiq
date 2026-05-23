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

export function CustomPackVolumeSlider({
  tierIndex,
  onTierIndexChange,
  tiers: tiersProp,
  className,
}: CustomPackVolumeSliderProps) {
  const tiers = tiersProp?.length ? tiersProp : scaleRowsFromCatalog();
  const maxIndex = Math.max(0, tiers.length - 1);
  const safeIndex = Math.min(tierIndex, maxIndex);
  const fillPercent = maxIndex > 0 ? (safeIndex / maxIndex) * 100 : 0;

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
      <div className="relative px-0.5">
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
          className={cn(
            "custom-pack-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent",
            "[&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10",
          )}
          style={
            {
              "--slider-fill": `${fillPercent}%`,
            } as CSSProperties
          }
        />
      </div>
      <div className="mt-3 flex justify-between gap-1 text-[11px] font-medium tabular-nums text-muted">
        {marks.map((mark, i) => (
          <span
            key={mark}
            className={cn(
              "min-w-0 text-center transition-colors",
              i === safeIndex && "text-foreground",
            )}
          >
            {mark.toLocaleString()}
          </span>
        ))}
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
