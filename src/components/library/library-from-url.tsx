"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useBrand } from "@/components/providers/brand-provider";
import { useCredits } from "@/contexts/credits-context";
import { useGeneration } from "@/contexts/generation-context";
import { getLibraryTemplate } from "@/lib/library/templates";
import { aspectRatioForLibraryTemplate } from "@/lib/library/template-aspect-ratio";
import { calculateGenerationTokenCost } from "@/lib/generation/token-cost";
import { toUserFacingGenerationError } from "@/lib/errors/user-facing";

/** Applies `?libraryId=` — attaches template, opens chat, auto-remixes when tokens allow. */
export function LibraryFromUrl() {
  const searchParams = useSearchParams();
  const { hasActiveBrand, isLoading } = useBrand();
  const { availableTokens } = useCredits();
  const {
    addReferenceImageFromUrl,
    setLibraryTemplateId,
    setAspectRatio,
    submitGeneration,
    prepareLibraryRemixSession,
    isGenerating,
    referenceImages,
    quantity,
    resolution,
    setErrorMessage,
  } = useGeneration();
  const sessionRef = useRef<string | null>(null);
  const autoSubmitRef = useRef<string | null>(null);

  const libraryId = searchParams.get("libraryId")?.trim() ?? null;

  useEffect(() => {
    if (!libraryId) return;
    if (isLoading || !hasActiveBrand) return;

    const template = getLibraryTemplate(libraryId);
    if (!template) return;

    if (sessionRef.current !== libraryId) {
      sessionRef.current = libraryId;
      autoSubmitRef.current = null;
      prepareLibraryRemixSession();
      setLibraryTemplateId(libraryId);
      addReferenceImageFromUrl({ url: template.imageUrl, name: "Template" });
      setAspectRatio(aspectRatioForLibraryTemplate(template));
      return;
    }

    const hasTemplateAttached = referenceImages.some(
      (img) =>
        img.name === "Template" && img.previewUrl === template.imageUrl,
    );
    if (!hasTemplateAttached) return;

    if (autoSubmitRef.current === libraryId || isGenerating) return;

    const tokenCost = calculateGenerationTokenCost({
      presetCount: 0,
      hasPrompt: false,
      isLibraryRemix: true,
      quantity,
      resolution,
      referenceImageCount: 1,
    });

    if (tokenCost > availableTokens) {
      const facing = toUserFacingGenerationError("Insufficient tokens");
      setErrorMessage(`${facing.title}: ${facing.message}`);
      return;
    }

    autoSubmitRef.current = libraryId;
    void submitGeneration();
  }, [
    libraryId,
    isLoading,
    hasActiveBrand,
    isGenerating,
    referenceImages,
    availableTokens,
    quantity,
    resolution,
    addReferenceImageFromUrl,
    setLibraryTemplateId,
    setAspectRatio,
    prepareLibraryRemixSession,
    submitGeneration,
    setErrorMessage,
  ]);

  return null;
}
