"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { DockTokenBadge } from "@/components/generation/dock-token-badge";
import { useGeneration } from "@/contexts/generation-context";
import { getResolutionOptionLabels } from "@/lib/ai/image/resolve-image-output";
import { ASPECT_RATIO_OPTIONS } from "@/lib/generation/presets";
import { cn } from "@/lib/utils";

type DockPresetTabsProps = {
  /** Page-embedded strip on Brand assets (no glass dock chrome). */
  embedded?: boolean;
};

function PresetTabHint({
  presetId,
  title,
  description,
  platformPixelHint,
  aspectRatio,
  resolution,
  onClose,
  hintRef,
}: {
  presetId: string;
  title: string;
  description: string;
  platformPixelHint?: string;
  aspectRatio: string;
  resolution: string;
  onClose: () => void;
  hintRef: RefObject<HTMLDivElement | null>;
}) {
  const ratioLabel = ASPECT_RATIO_OPTIONS.find((o) => o.value === aspectRatio);
  const resLabel = getResolutionOptionLabels({
    aspectRatio: aspectRatio as (typeof ASPECT_RATIO_OPTIONS)[number]["value"],
    presetId,
  }).find((o) => o.value === resolution);

  return (
    <div
      ref={hintRef}
      className="relative rounded-lg border border-border/60 bg-white/70 py-2.5 pl-3 pr-9 text-xs backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-sidebar-active hover:text-foreground"
        aria-label="Close preset details"
      >
        <HugeiconsIcon
          icon={Cancel01Icon}
          size={14}
          color="currentColor"
          strokeWidth={2}
        />
      </button>
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 leading-relaxed text-muted">{description}</p>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted">
        {ratioLabel ? (
          <span>
            {ratioLabel.label} · {ratioLabel.description}
          </span>
        ) : null}
        {platformPixelHint ? <span>{platformPixelHint}</span> : null}
        {resLabel ? <span>Output: {resLabel.description}</span> : null}
      </div>
    </div>
  );
}

export function DockPresetTabs({ embedded = false }: DockPresetTabsProps) {
  const {
    selectedPresets,
    activePresetId,
    setActivePreset,
    removePreset,
    aspectRatio,
    resolution,
  } = useGeneration();

  const [hintPresetId, setHintPresetId] = useState<string | null>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const presetTabsRef = useRef<HTMLDivElement>(null);

  const hintPreset = hintPresetId
    ? selectedPresets.find((p) => p.id === hintPresetId)
    : undefined;

  useEffect(() => {
    if (hintPresetId && !selectedPresets.some((p) => p.id === hintPresetId)) {
      setHintPresetId(null);
    }
  }, [hintPresetId, selectedPresets]);

  useEffect(() => {
    if (!hintPresetId) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (hintRef.current?.contains(target)) return;
      if (presetTabsRef.current?.contains(target)) return;
      setHintPresetId(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [hintPresetId]);

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 rounded-xl border p-2",
        embedded
          ? "border-border bg-surface shadow-sm"
          : "border-white/60 bg-white/50 shadow-sm backdrop-blur-xl backdrop-saturate-150",
      )}
    >
      <div className="flex w-full items-stretch gap-2">
        <div
          ref={presetTabsRef}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
        >
          {selectedPresets.length === 0 && (
            <span className="px-2 py-1.5 text-xs text-muted">
              {embedded
                ? "Choose a format below"
                : "Select a preset below to get started"}
            </span>
          )}

          {selectedPresets.map((preset) => {
            const isActive = activePresetId === preset.id;
            const hintOpen = hintPresetId === preset.id;
            return (
              <div
                key={preset.id}
                className={cn(
                  "inline-flex max-w-[200px] shrink-0 items-center rounded-lg border bg-white/90 backdrop-blur-sm transition-colors",
                  isActive || hintOpen
                    ? "border-accent/40 shadow-sm ring-1 ring-accent/20"
                    : "border-border/70",
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActivePreset(preset.id);
                    setHintPresetId((prev) =>
                      prev === preset.id ? null : preset.id,
                    );
                  }}
                  className="flex min-w-0 cursor-pointer items-center gap-2 py-1.5 pl-2.5 pr-1 text-left"
                  aria-expanded={hintOpen}
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
                  onClick={() => {
                    removePreset(preset.id);
                    if (hintPresetId === preset.id) {
                      setHintPresetId(null);
                    }
                  }}
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

      {hintPreset ? (
        <PresetTabHint
          hintRef={hintRef}
          presetId={hintPreset.id}
          title={hintPreset.title}
          description={hintPreset.description}
          platformPixelHint={hintPreset.platformPixelHint}
          aspectRatio={aspectRatio}
          resolution={resolution}
          onClose={() => setHintPresetId(null)}
        />
      ) : null}
    </div>
  );
}
