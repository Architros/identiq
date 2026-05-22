"use client";

import { useCallback, useMemo, type CSSProperties } from "react";
import { CUSTOM_PACK_TIERS } from "@/lib/billing/custom-pack-pricing";
import { cn } from "@/lib/utils";

type CustomPackVolumeSliderProps = {
  tierIndex: number;
  onTierIndexChange: (index: number) => void;
  className?: string;
};

const TIER_COUNT = CUSTOM_PACK_TIERS.length;
const MAX_INDEX = TIER_COUNT - 1;

export function CustomPackVolumeSlider({
  tierIndex,
  onTierIndexChange,
  className,
}: CustomPackVolumeSliderProps) {
  const fillPercent = MAX_INDEX > 0 ? (tierIndex / MAX_INDEX) * 100 : 0;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onTierIndexChange(Number(e.target.value));
    },
    [onTierIndexChange],
  );

  const marks = useMemo(
    () => CUSTOM_PACK_TIERS.map((t) => t.monthlyTokens),
    [],
  );

  return (
    <div className={cn("w-full", className)}>
      <div className="relative px-0.5">
        <input
          type="range"
          min={0}
          max={MAX_INDEX}
          step={1}
          value={tierIndex}
          onChange={handleChange}
          aria-label="Token pack size"
          aria-valuemin={marks[0]}
          aria-valuemax={marks[MAX_INDEX]}
          aria-valuenow={marks[tierIndex]}
          aria-valuetext={`${marks[tierIndex].toLocaleString()} tokens`}
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
              i === tierIndex && "text-foreground",
            )}
          >
            {mark.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  );
}
