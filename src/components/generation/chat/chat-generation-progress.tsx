"use client";

import { useMemo } from "react";
import { AITextLoading } from "@/components/ui/ai-text-loading";
import { ImageSkeletonGrid } from "@/components/generation/chat/image-skeleton-grid";
import { useGeneration } from "@/contexts/generation-context";
import type { GenerationPhase } from "@/lib/generation/chat-message-types";
import { generationProgressTexts } from "@/lib/generation/generation-progress-texts";

type ChatGenerationProgressProps = {
  phase?: GenerationPhase | null;
};

export function ChatGenerationProgress({ phase }: ChatGenerationProgressProps) {
  const {
    isGenerating,
    generationStartedAt,
    libraryTemplateId,
    aspectRatio,
    quantity,
    generationPhase,
    generationPresetTitle,
    generationError,
    submitGeneration,
  } = useGeneration();

  const isLibraryRemix = Boolean(libraryTemplateId);
  const activePhase = phase ?? generationPhase;
  const isFailed =
    activePhase === "error" || Boolean(generationError?.trim());
  const pendingLibraryStart = isLibraryRemix && !isGenerating && !isFailed;

  if (!isGenerating && !pendingLibraryStart && !isFailed) return null;

  const effectivePhase = pendingLibraryStart
    ? ("composing-prompt" as const)
    : activePhase;
  const isComposingEffective =
    !isFailed &&
    (effectivePhase === "composing-prompt" ||
      effectivePhase === "orchestrating");
  const isRenderingEffective =
    !isFailed && effectivePhase === "generating-image";

  const progressTexts = useMemo(
    () =>
      generationProgressTexts({
        phase: effectivePhase ?? undefined,
        presetTitle: generationPresetTitle ?? undefined,
        isLibraryRemix,
      }),
    [effectivePhase, generationPresetTitle, isLibraryRemix],
  );

  if (isFailed) {
    return (
      <div className="w-full space-y-2">
        <p className="text-sm text-muted">
          {generationError ??
            "Something went wrong while creating your image. Please try again."}
        </p>
        <ImageSkeletonGrid
          aspectRatio={aspectRatio}
          quantity={quantity}
          animated={false}
          failed
          onRetry={() => void submitGeneration()}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {isComposingEffective ? (
        <AITextLoading
          texts={progressTexts}
          size="sm"
          compact
          interval={1400}
        />
      ) : null}

      {isRenderingEffective ? (
        <ImageSkeletonGrid
          aspectRatio={aspectRatio}
          quantity={quantity}
          elapsedStartedAt={generationStartedAt}
          progressTexts={progressTexts}
        />
      ) : !isComposingEffective && !isRenderingEffective ? (
        <AITextLoading
          texts={progressTexts}
          size="sm"
          compact
          interval={1400}
        />
      ) : null}
    </div>
  );
}
