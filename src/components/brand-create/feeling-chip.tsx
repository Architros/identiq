"use client";

import { cn } from "@/lib/utils";

type FeelingChipProps = {
  label: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
};

export function FeelingChip({
  label,
  description,
  selected,
  disabled,
  onToggle,
}: FeelingChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "flex cursor-pointer flex-col gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
        selected
          ? "border-accent bg-accent/[0.08] text-accent"
          : "border-border bg-surface text-foreground hover:bg-sidebar-active",
        disabled && !selected && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-[11px] text-muted">{description}</span>
    </button>
  );
}
