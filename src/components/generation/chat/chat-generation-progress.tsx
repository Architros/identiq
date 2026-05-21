"use client";

import { ThinkingBlock } from "@/components/generation/chat/thinking-block";
import { ImageSkeletonGrid } from "@/components/generation/chat/image-skeleton-grid";
import { useGeneration } from "@/contexts/generation-context";
import type { GenerationPhase } from "@/lib/generation/chat-message-types";
import { generationActivityLabel } from "@/lib/generation/generation-activity-label";

type ChatGenerationProgressProps = {
  phase?: GenerationPhase | null;
};

export function ChatGenerationProgress({ phase }: ChatGenerationProgressProps) {
  const {
    isGenerating,
    generationActivity,
    generationStartedAt,
    libraryTemplateId,
    aspectRatio,
    quantity,
    generationPhase,
  } = useGeneration();

  const isLibraryRemix = Boolean(libraryTemplateId);
  const activePhase = phase ?? generationPhase;
  const pendingLibraryStart = isLibraryRemix && !isGenerating;
  if (!isGenerating && !pendingLibraryStart) return null;

  const effectivePhase = pendingLibraryStart
    ? ("composing-prompt" as const)
    : activePhase;
  const isComposingEffective =
    effectivePhase === "composing-prompt" || effectivePhase === "orchestrating";
  const isRenderingEffective = effectivePhase === "generating-image";

  const activity =
    generationActivity ??
    generationActivityLabel({
      phase: effectivePhase ?? undefined,
      isLibraryRemix,
    });

  return (
    <div className="w-full space-y-3">
      {isComposingEffective ? (
        <ThinkingBlock
          isStreaming={isGenerating || pendingLibraryStart}
          phase={effectivePhase ?? undefined}
          isLibraryRemix={isLibraryRemix}
          activityLabel={activity}
          textContent=""
          reasoningContent=""
        />
      ) : null}

      {isRenderingEffective ? (
        <ImageSkeletonGrid
          aspectRatio={aspectRatio}
          quantity={quantity}
          elapsedStartedAt={generationStartedAt}
          activityLabel={activity}
        />
      ) : !isComposingEffective ? (
        <p className="text-sm font-medium text-foreground">{activity}</p>
      ) : null}
    </div>
  );
}
