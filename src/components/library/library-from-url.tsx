"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useBrand } from "@/components/providers/brand-provider";
import { useGeneration } from "@/contexts/generation-context";
import { getPresetById } from "@/lib/generation/presets";
import { getLibraryTemplate } from "@/lib/library/templates";
import { aspectRatioForLibraryTemplate } from "@/lib/library/template-aspect-ratio";

/** Applies `?libraryId=` — attaches template and opens remix chat state. */
export function LibraryFromUrl() {
  const searchParams = useSearchParams();
  const { hasActiveBrand, isLoading } = useBrand();
  const {
    addReferenceImageFromUrl,
    setLibraryTemplateId,
    setAspectRatio,
    prepareLibraryRemixSession,
    addPreset,
  } = useGeneration();
  const sessionRef = useRef<string | null>(null);

  const libraryId = searchParams.get("libraryId")?.trim() ?? null;
  const carryPresetIds = searchParams.get("carryPresetIds")?.trim() ?? "";

  useEffect(() => {
    if (!libraryId) return;
    if (isLoading || !hasActiveBrand) return;

    const template = getLibraryTemplate(libraryId);
    if (!template) return;

    if (sessionRef.current !== libraryId) {
      sessionRef.current = libraryId;
      prepareLibraryRemixSession();
      if (carryPresetIds) {
        for (const presetId of carryPresetIds.split(",")) {
          const preset = getPresetById(presetId.trim());
          if (preset) addPreset(preset);
        }
      }
      setLibraryTemplateId(libraryId);
      addReferenceImageFromUrl({ url: template.imageUrl, name: "Template" });
      setAspectRatio(aspectRatioForLibraryTemplate(template));
      return;
    }
  }, [
    libraryId,
    carryPresetIds,
    isLoading,
    hasActiveBrand,
    addReferenceImageFromUrl,
    addPreset,
    setLibraryTemplateId,
    setAspectRatio,
    prepareLibraryRemixSession,
  ]);

  return null;
}
