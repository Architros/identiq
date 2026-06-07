"use client";

import { DockPresetTabs } from "@/components/generation/dock-preset-tabs";
import { DockPromptArea } from "@/components/generation/dock-prompt-area";
import { useGeneration } from "@/contexts/generation-context";
import { cn } from "@/lib/utils";

export type GenerationDockVariant = "ideas-grid" | "images";

type GenerationDockProps = {
  variant?: GenerationDockVariant;
  compact?: boolean;
};

export function GenerationDock({ variant, compact }: GenerationDockProps) {
  const { view, selectedPresets } = useGeneration();
  const resolvedVariant: GenerationDockVariant =
    variant ?? (view === "chat" ? "images" : "ideas-grid");
  const showImagePresetTabs =
    resolvedVariant === "images" && selectedPresets.length > 0;

  return (
    <div
      className="flex w-full max-w-2xl flex-col gap-2"
      aria-label="Generation controls"
    >
      {resolvedVariant === "ideas-grid" ? <DockPresetTabs /> : null}
      {showImagePresetTabs ? <DockPresetTabs embedded /> : null}
      <div
        className={cn(
          "w-full overflow-visible rounded-2xl border border-border/80 bg-surface",
          "shadow-sm",
        )}
      >
        <DockPromptArea variant={resolvedVariant} compact={compact} />
      </div>
    </div>
  );
}
