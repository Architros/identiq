"use client";

import { useMemo } from "react";
import { DockSelect } from "@/components/generation/dock-select";
import { useGeneration } from "@/contexts/generation-context";
import { getResolutionOptionLabels } from "@/lib/ai/image/resolve-image-output";
import { ASPECT_RATIO_OPTIONS, type AspectRatio } from "@/lib/generation/presets";
import { cn } from "@/lib/utils";

export function DockSettingsRow({ compact = false }: { compact?: boolean }) {
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

  return (
    <div
      className={cn(
        "flex items-center",
        compact ? "gap-1" : "gap-1.5",
      )}
    >
      <DockSelect
        label="Aspect ratio"
        value={aspectRatio}
        options={ASPECT_RATIO_OPTIONS}
        onChange={(v) => setAspectRatio(v as AspectRatio)}
        disabled={presetLocked}
      />
      <DockSelect
        label="Resolution"
        value={resolution}
        options={resolutionOptions}
        onChange={setResolution}
      />
      <DockSelect
        label="Quantity"
        value={quantity}
        options={quantityOptions}
        onChange={setQuantity}
      />
    </div>
  );
}
