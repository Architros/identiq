"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useGeneration } from "@/contexts/generation-context";
import { getPresetById } from "@/lib/generation/presets";

/** Applies `?presetId=` from the URL once when Ideas mounts. */
export function IdeasPresetFromUrl() {
  const searchParams = useSearchParams();
  const { addPreset } = useGeneration();
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    const presetId = searchParams.get("presetId")?.trim();
    if (!presetId || appliedRef.current === presetId) return;
    const preset = getPresetById(presetId);
    if (!preset) return;
    appliedRef.current = presetId;
    addPreset(preset);
  }, [searchParams, addPreset]);

  return null;
}
