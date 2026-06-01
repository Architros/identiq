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
    activePresetId,
    selectedPresets,
    setAspectRatio,
    setResolution,
    setQuantity,
  } = useGeneration();

  const presetLocked = selectedPresets.length > 0;

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
        disabled={presetLocked}
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
        fullWidth={stacked}
      />
    </div>
  );
}
