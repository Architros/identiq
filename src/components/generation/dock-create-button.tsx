"use client";

import { useBrand } from "@/components/providers/brand-provider";
import { useCredits } from "@/contexts/credits-context";
import { useGeneration } from "@/contexts/generation-context";
import { calculateGenerationTokenCost } from "@/lib/generation/token-cost";
import { TextureButton } from "@/components/ui/texture-button";
import { cn } from "@/lib/utils";

export function DockCreateButton() {
  const { hasActiveBrand, isLoading } = useBrand();
  const { availableTokens } = useCredits();
  const {
    selectedPresets,
    prompt,
    quantity,
    resolution,
    referenceImages,
    libraryTemplateId,
    isGenerating,
    submitGeneration,
    stopGeneration,
  } = useGeneration();

  const isLibraryRemix = Boolean(libraryTemplateId);

  const tokenCost = calculateGenerationTokenCost({
    presetCount: selectedPresets.length,
    hasPrompt: prompt.trim().length > 0,
    isLibraryRemix,
    quantity,
    resolution,
    referenceImageCount: referenceImages.length,
  });

  const insufficient = tokenCost > 0 && tokenCost > availableTokens;

  const canSubmit =
    !isLoading &&
    hasActiveBrand &&
    (selectedPresets.length > 0 || prompt.trim().length > 0 || isLibraryRemix) &&
    !isGenerating &&
    !insufficient;

  if (isGenerating) {
    return (
      <button
        type="button"
        onClick={() => stopGeneration()}
        className={cn(
          "ml-2 h-9 shrink-0 cursor-pointer rounded-xl px-5 text-sm font-semibold transition-colors",
          "border border-border bg-surface text-foreground hover:bg-sidebar-active",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        )}
      >
        Stop
      </button>
    );
  }

  return (
    <TextureButton
      type="button"
      variant="accent"
      shape="card"
      disabled={!canSubmit}
      onClick={() => submitGeneration()}
      className="ml-2 shrink-0"
      innerClassName="h-9 px-5"
    >
      Create
    </TextureButton>
  );
}
