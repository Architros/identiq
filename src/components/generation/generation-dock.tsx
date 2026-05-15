"use client";

import { DockPresetTabs } from "@/components/generation/dock-preset-tabs";
import { DockPromptArea } from "@/components/generation/dock-prompt-area";
import { useGeneration } from "@/contexts/generation-context";

export function GenerationDock() {
  const { view } = useGeneration();

  return (
    <div
      className="flex w-full max-w-2xl flex-col gap-2"
      aria-label="Generation controls"
    >
      {view === "grid" ? <DockPresetTabs /> : null}
      <div className="w-full overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <DockPromptArea />
      </div>
    </div>
  );
}
