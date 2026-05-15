"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { DockTokenBadge } from "@/components/generation/dock-token-badge";
import { useGeneration } from "@/contexts/generation-context";
import { cn } from "@/lib/utils";

export function DockPresetTabs() {
  const {
    selectedPresets,
    activePresetId,
    setActivePreset,
    removePreset,
  } = useGeneration();

  return (
    <div className="flex w-full items-stretch gap-2 rounded-xl border border-white/60 bg-white/50 p-2 shadow-sm backdrop-blur-xl backdrop-saturate-150">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {selectedPresets.length === 0 && (
          <span className="px-2 py-1.5 text-xs text-muted">
            Select a preset below to get started
          </span>
        )}

        {selectedPresets.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <div
              key={preset.id}
              className={cn(
                "inline-flex max-w-[200px] shrink-0 items-center rounded-lg border bg-white/90 backdrop-blur-sm transition-colors",
                isActive
                  ? "border-border shadow-sm"
                  : "border-border/70",
              )}
            >
              <button
                type="button"
                onClick={() => setActivePreset(preset.id)}
                className="flex min-w-0 cursor-pointer items-center gap-2 py-1.5 pl-2.5 pr-1 text-left"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sidebar-active">
                  <HugeiconsIcon
                    icon={preset.platformIcon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.75}
                    className="text-muted"
                  />
                </span>
                <span className="truncate text-xs font-medium text-foreground">
                  {preset.title}
                </span>
              </button>
              <button
                type="button"
                onClick={() => removePreset(preset.id)}
                className="mr-1.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-sidebar-active hover:text-foreground"
                aria-label={`Remove ${preset.title}`}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={12}
                  color="currentColor"
                  strokeWidth={2}
                />
              </button>
            </div>
          );
        })}
      </div>

      <DockTokenBadge />
    </div>
  );
}
