"use client";

import { DockSelect } from "@/components/generation/dock-select";
import { useGeneration } from "@/contexts/generation-context";
import type { AspectRatio, Resolution } from "@/lib/generation/presets";

const aspectRatioOptions: { value: AspectRatio; label: string; description: string }[] = [
  { value: "1:1", label: "1:1", description: "Square" },
  { value: "9:16", label: "9:16", description: "Story" },
  { value: "16:9", label: "16:9", description: "Wide" },
  { value: "4:5", label: "4:5", description: "Portrait" },
];

const resolutionOptions: { value: Resolution; label: string; description: string }[] = [
  { value: "1K", label: "1K", description: "Standard" },
  { value: "2K", label: "2K", description: "High res" },
];

const quantityOptions = [1, 2, 3, 4].map((q) => ({
  value: q,
  label: `${q}x`,
  description: q === 1 ? "Single" : `${q} variations`,
}));

export function DockSettingsRow() {
  const {
    aspectRatio,
    resolution,
    quantity,
    setAspectRatio,
    setResolution,
    setQuantity,
  } = useGeneration();

  return (
    <div className="flex items-center gap-1.5">
      <DockSelect
        label="Aspect ratio"
        value={aspectRatio}
        options={aspectRatioOptions}
        onChange={setAspectRatio}
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
