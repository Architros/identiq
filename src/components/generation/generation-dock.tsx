"use client";

import { DockPresetTabs } from "@/components/generation/dock-preset-tabs";
import { DockPromptArea } from "@/components/generation/dock-prompt-area";
import { useGeneration } from "@/contexts/generation-context";
import { cn } from "@/lib/utils";

export type GenerationDockVariant = "ideas-grid" | "images";

type GenerationDockProps = {
  variant?: GenerationDockVariant;
};

export function GenerationDock({ variant }: GenerationDockProps) {
  const { view } = useGeneration();
  const resolvedVariant: GenerationDockVariant =
    variant ?? (view === "chat" ? "images" : "ideas-grid");

  return (
    <div
      className="flex w-full max-w-2xl flex-col gap-2"
      aria-label="Generation controls"
    >
      {resolvedVariant === "ideas-grid" ? <DockPresetTabs /> : null}
      <div
        className={cn(
          "w-full overflow-hidden rounded-2xl border border-border/80 bg-surface",
          "shadow-sm",
        )}
      >
        <DockPromptArea variant={resolvedVariant} />
      </div>
    </div>
  );
}
