"use client";

import { useMemo } from "react";
import { DockSelect } from "@/components/generation/dock-select";
import { useGeneration } from "@/contexts/generation-context";
import { getResolutionOptionLabels } from "@/lib/ai/image/resolve-image-output";
import { ASPECT_RATIO_OPTIONS, type AspectRatio } from "@/lib/generation/presets";
import { cn } from "@/lib/utils";

type DockSettingsFieldsProps = {
  layout?: "inline" | "stacked";
  /** Called after a value is picked (e.g. close mobile menu). */
  onChange?: () => void;
};

export function DockSettingsFields({
  layout = "inline",
  onChange,
}: DockSettingsFieldsProps) {
  const {
    aspectRatio,
    resolution,
    quantity,
    withBackground,
    activePresetId,
    selectedPresets,
    isGenerating,
    setAspectRatio,
    setResolution,
    setQuantity,
    setWithBackground,
  } = useGeneration();

  const presetLocked = selectedPresets.length > 0;
  const settingsLocked = isGenerating || presetLocked;

  const resolutionOptions = useMemo(
    () =>
      getResolutionOptionLabels({
        aspectRatio,
        presetId: activePresetId ?? undefined,
      }),
    [aspectRatio, activePresetId],
  );

  const quantityOptions = [1, 2, 3, 4].map((q) => ({
    value: q,
    label: `${q}x`,
    description: q === 1 ? "Single" : `${q} variations`,
  }));

  const stacked = layout === "stacked";
  const showBackgroundToggle = selectedPresets.length === 0;

  return (
    <div
      className={cn(
        stacked ? "flex flex-col gap-2" : "flex items-center gap-1",
      )}
    >
      <DockSelect
        label="Aspect ratio"
        value={aspectRatio}
        options={ASPECT_RATIO_OPTIONS}
        onChange={(v) => {
          setAspectRatio(v as AspectRatio);
          onChange?.();
        }}
        disabled={settingsLocked}
        fullWidth={stacked}
      />
      <DockSelect
        label="Resolution"
        value={resolution}
        options={resolutionOptions}
        onChange={(v) => {
          setResolution(v);
          onChange?.();
        }}
        disabled={isGenerating}
        fullWidth={stacked}
      />
      <DockSelect
        label="Quantity"
        value={quantity}
        options={quantityOptions}
        onChange={(v) => {
          setQuantity(v);
          onChange?.();
        }}
        disabled={isGenerating}
        fullWidth={stacked}
      />
      {showBackgroundToggle ? (
        <button
          type="button"
          disabled={isGenerating}
          onClick={() => {
            setWithBackground(!withBackground);
            onChange?.();
          }}
          className={cn(
            "inline-flex cursor-pointer items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
            withBackground
              ? "border-accent/35 bg-accent/[0.08] text-foreground"
              : "border-border bg-white/90 text-muted hover:bg-sidebar-active",
            stacked && "justify-start",
            isGenerating && "pointer-events-none opacity-50",
          )}
          aria-pressed={withBackground}
        >
          With background
        </button>
      ) : null}
    </div>
  );
}
