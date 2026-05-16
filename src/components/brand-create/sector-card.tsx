"use client";

import type { BrandSector } from "@/lib/brand/brand-project-draft";
import { cn } from "@/lib/utils";

type SectorCardProps = {
  id: BrandSector;
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
};

export function SectorCard({
  label,
  description,
  selected,
  onSelect,
}: SectorCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex cursor-pointer flex-col gap-1 rounded-2xl border p-4 text-left transition-colors",
        selected
          ? "border-accent bg-accent/[0.06] ring-1 ring-accent/30"
          : "border-border bg-surface hover:border-accent/40 hover:bg-sidebar-active/50",
      )}
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="text-xs text-muted">{description}</span>
    </button>
  );
}
