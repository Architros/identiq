"use client";

import { useMemo } from "react";
import { AITextLoading } from "@/components/ui/ai-text-loading";
import { ImageSkeletonGrid } from "@/components/generation/chat/image-skeleton-grid";
import { useGeneration } from "@/contexts/generation-context";
import type { GenerationPhase } from "@/lib/generation/chat-message-types";
import { generationProgressTexts } from "@/lib/generation/generation-progress-texts";
import { cn } from "@/lib/utils";

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
    referenceImages,
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
  const remixPreviewUrl = isLibraryRemix
    ? referenceImages.find((img) => img.name === "Template")?.previewUrl ??
      referenceImages[0]?.previewUrl
    : undefined;

  if (isFailed) {
    return (
      <div
        className={cn(
          "w-full space-y-4",
          isLibraryRemix && "flex flex-col items-start text-left",
        )}
      >
        {isLibraryRemix ? (
          <header className="space-y-2">
            <h2 className="font-display text-xl font-normal tracking-tight text-foreground sm:text-2xl">
              Remix failed
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted">
              {generationError ??
                "Something went wrong while creating your image. Please try again."}
            </p>
          </header>
        ) : (
          <p className="text-sm text-muted">
            {generationError ??
              "Something went wrong while creating your image. Please try again."}
          </p>
        )}
        <ImageSkeletonGrid
          aspectRatio={aspectRatio}
          quantity={quantity}
          mediaTypeLabel={generationPresetTitle}
          remixPreviewUrl={remixPreviewUrl}
          animated={false}
          failed
          centered={false}
          onRetry={() => void submitGeneration()}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full space-y-3",
        isLibraryRemix && "flex flex-col items-start text-left",
      )}
    >
      {isComposingEffective || isRenderingEffective ? (
        <ImageSkeletonGrid
          aspectRatio={aspectRatio}
          quantity={quantity}
          mediaTypeLabel={generationPresetTitle}
          remixPreviewUrl={remixPreviewUrl}
          elapsedStartedAt={generationStartedAt}
          progressTexts={progressTexts}
          centered={false}
        />
      ) : (
        <AITextLoading
          texts={progressTexts}
          size="sm"
          compact
          interval={1400}
        />
      )}
    </div>
  );
}
