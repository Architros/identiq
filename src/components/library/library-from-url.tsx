"use client";

import { useEffect } from "react";
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
    isGenerating,
    showChatView,
    addReferenceImageFromUrl,
    setLibraryTemplateId,
    setAspectRatio,
    setResolution,
    prepareLibraryRemixSession,
    openChatSession,
    ensureChatSession,
    addPreset,
    clearPresets,
    clearReferenceImages,
    isLibraryRemixInitDone,
    markLibraryRemixInitDone,
  } = useGeneration();

  const libraryId = searchParams.get("libraryId")?.trim() ?? null;
  const carryPresetIds = searchParams.get("carryPresetIds")?.trim() ?? "";
  const carryChatId = searchParams.get("carryChatId")?.trim() ?? "";
  const remixInit = searchParams.get("remixInit")?.trim() ?? "";

  useEffect(() => {
    if (!libraryId) return;
    showChatView();
  }, [libraryId, showChatView]);

  useEffect(() => {
    if (!libraryId) return;
    if (isLoading || !hasActiveBrand) return;

    const template = getLibraryTemplate(libraryId);
    if (!template) return;

    const sessionKey = `${libraryId}:${remixInit || "0"}`;
    if (isLibraryRemixInitDone(sessionKey)) return;

    if (isGenerating) {
      markLibraryRemixInitDone(sessionKey);
      setLibraryTemplateId(libraryId);
      return;
    }

    const isResumeSession = Boolean(carryChatId);
    markLibraryRemixInitDone(sessionKey);

    void (async () => {
      if (isResumeSession) {
        await openChatSession(carryChatId);
      } else {
        prepareLibraryRemixSession();
        await ensureChatSession("Library remix");
      }

      clearReferenceImages();
      if (carryPresetIds) {
        clearPresets();
        for (const presetId of carryPresetIds.split(",")) {
          const preset = getPresetById(presetId.trim());
          if (preset) addPreset(preset);
        }
      } else {
        clearPresets();
      }
      setLibraryTemplateId(libraryId);
      addReferenceImageFromUrl({ url: template.imageUrl, name: "Template" });
      setAspectRatio(aspectRatioForLibraryTemplate(template));
      setResolution("1K");
    })();
  }, [
    libraryId,
    carryPresetIds,
    carryChatId,
    remixInit,
    isLoading,
    hasActiveBrand,
    isGenerating,
    showChatView,
    addReferenceImageFromUrl,
    addPreset,
    clearPresets,
    clearReferenceImages,
    setLibraryTemplateId,
    setAspectRatio,
    setResolution,
    openChatSession,
    prepareLibraryRemixSession,
    ensureChatSession,
    isLibraryRemixInitDone,
    markLibraryRemixInitDone,
  ]);

  return null;
}
