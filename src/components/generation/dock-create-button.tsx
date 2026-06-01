"use client";

import { useBrand } from "@/components/providers/brand-provider";
import { useCredits } from "@/contexts/credits-context";
import { useGeneration } from "@/contexts/generation-context";
import { calculateGenerationTokenCost } from "@/lib/generation/token-cost";
import { showErrorToast } from "@/lib/toast/show-toast";
import { TextureButton } from "@/components/ui/texture-button";
import { cn } from "@/lib/utils";

type DockCreateButtonProps = {
  compact?: boolean;
};

export function DockCreateButton({ compact = false }: DockCreateButtonProps) {
  const { isLoading } = useBrand();
  const { availableTokens, isLoading: creditsLoading, openBuyTokens } =
    useCredits();
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
  const hasGenerationInput =
    selectedPresets.length > 0 || prompt.trim().length > 0 || isLibraryRemix;

  const tokenCost = calculateGenerationTokenCost({
    presetCount: selectedPresets.length,
    hasPrompt: prompt.trim().length > 0,
    isLibraryRemix,
    quantity,
    resolution,
    referenceImageCount: referenceImages.length,
  });

  const insufficient =
    !creditsLoading && tokenCost > 0 && tokenCost > availableTokens;

  const canSubmit =
    !isLoading &&
    !creditsLoading &&
    hasGenerationInput &&
    !isGenerating &&
    !insufficient;

  const handleCreate = () => {
    if (isGenerating) return;
    if (isLoading || creditsLoading) {
      showErrorToast("Still loading your account. Try again in a moment.", {
        mapAsGeneration: false,
      });
      return;
    }
    if (!hasGenerationInput) return;
    if (insufficient) {
      showErrorToast("Insufficient tokens", {
        dedupeKey: "insufficient-tokens",
      });
      openBuyTokens();
      return;
    }
    void submitGeneration();
  };

  if (isGenerating) {
    return (
      <button
        type="button"
        onClick={() => stopGeneration()}
        className={cn(
          "shrink-0 cursor-pointer rounded-xl text-sm font-semibold transition-colors",
          compact ? "h-8 px-4 max-md:ml-0 md:ml-2" : "ml-2 h-9 px-5",
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
      disabled={!hasGenerationInput}
      onClick={handleCreate}
      className={cn(
        "shrink-0",
        compact ? "max-md:ml-0 md:ml-2" : "ml-2",
        !canSubmit && hasGenerationInput && "opacity-60",
      )}
      innerClassName={cn(compact ? "h-8 px-4 text-sm" : "h-9 px-5")}
    >
      Create
    </TextureButton>
  );
}
