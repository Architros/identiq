"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  TickDouble01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useGeneration } from "@/contexts/generation-context";
import type { GenerationPreset } from "@/lib/generation/presets";

type PresetCardProps = {
  preset: GenerationPreset;
};

export function PresetCard({ preset }: PresetCardProps) {
  const { selectedPresets, addPreset, removePreset } = useGeneration();
  const isSelected = selectedPresets.some((p) => p.id === preset.id);

  const handleClick = () => {
    if (isSelected) {
      removePreset(preset.id);
    } else {
      addPreset(preset);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isSelected}
      className={cn(
        "group relative flex min-h-[120px] cursor-pointer flex-col gap-4 rounded-xl border p-4 text-left",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2",
        "hover:-translate-y-0.5 hover:shadow-md",
        "active:translate-y-0 active:scale-[0.98] active:shadow-sm",
        isSelected
          ? "border-accent/60 bg-accent/[0.06] shadow-sm ring-1 ring-accent/25"
          : "border-border/80 bg-surface hover:border-accent/35 hover:bg-surface hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]",
      )}
    >
      <span
        className={cn(
          "absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full transition-all duration-200",
          isSelected
            ? "bg-accent text-white shadow-sm"
            : "border border-border/80 bg-surface text-muted opacity-60 group-hover:border-accent/40 group-hover:bg-accent/10 group-hover:text-accent group-hover:opacity-100",
        )}
        aria-hidden
      >
        <HugeiconsIcon
          icon={isSelected ? TickDouble01Icon : Add01Icon}
          size={isSelected ? 14 : 12}
          color="currentColor"
          strokeWidth={isSelected ? 2.25 : 2}
        />
      </span>

      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-200",
          isSelected
            ? "bg-accent/15"
            : "bg-sidebar-active group-hover:bg-accent/10",
        )}
      >
        <HugeiconsIcon
          icon={preset.platformIcon}
          size={18}
          color="currentColor"
          strokeWidth={1.75}
          className={cn(
            "transition-colors duration-200",
            isSelected ? "text-accent" : "text-muted group-hover:text-foreground",
          )}
        />
      </span>

      <div className="space-y-1.5 pr-6">
        <h3
          className={cn(
            "text-[15px] font-semibold leading-tight transition-colors duration-200",
            isSelected ? "text-foreground" : "text-foreground group-hover:text-foreground",
          )}
        >
          {preset.title}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted">
          {preset.description}
        </p>
      </div>
    </button>
  );
}
