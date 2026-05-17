"use client";

import { useGeneration } from "@/contexts/generation-context";
import { getPresetById } from "@/lib/generation/presets";
import { getResolutionOptionLabels } from "@/lib/ai/image/resolve-image-output";

/** Shows platform target hint and output size when a preset is active. */
export function DockPlatformHint() {
  const { activePresetId, aspectRatio, resolution } = useGeneration();

  const preset = activePresetId ? getPresetById(activePresetId) : undefined;
  if (!preset) return null;

  const resLabel = getResolutionOptionLabels({
    aspectRatio,
    presetId: activePresetId ?? undefined,
  }).find((o) => o.value === resolution);

  return (
    <div className="space-y-0.5 px-4 pb-1">
      {preset.platformPixelHint ? (
        <p className="text-[11px] text-muted">{preset.platformPixelHint}</p>
      ) : null}
      {resLabel ? (
        <p className="text-[11px] text-muted">
          Output: {resLabel.description}
        </p>
      ) : null}
    </div>
  );
}
