"use client";

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

  const activity =
    generationActivity ??
    generationActivityLabel({
      phase: effectivePhase ?? undefined,
      isLibraryRemix,
    });

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
        <p className="text-sm text-muted">
          {isLibraryRemix && (isGenerating || pendingLibraryStart)
            ? activity || "Thinking…"
            : "Thinking…"}
        </p>
      ) : null}

      {isRenderingEffective ? (
        <ImageSkeletonGrid
          aspectRatio={aspectRatio}
          quantity={quantity}
          elapsedStartedAt={generationStartedAt}
          activityLabel={activity}
        />
      ) : !isComposingEffective && !isRenderingEffective ? (
        <p className="text-sm font-medium text-foreground">{activity}</p>
      ) : null}
    </div>
  );
}
