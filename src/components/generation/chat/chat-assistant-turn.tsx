"use client";

import { useMemo } from "react";
import type { ImageResultData, IdentiqUIMessage } from "@/lib/generation/chat-message-types";
import { parseAssistantMessage } from "@/lib/generation/parse-assistant-message";
import { formatInlineGenerationError } from "@/lib/generation/format-inline-generation-error";
import { ImageSkeletonGrid } from "@/components/generation/chat/image-skeleton-grid";
import { GeneratedImageCard } from "@/components/generation/chat/generated-image-card";
import { AITextLoading } from "@/components/ui/ai-text-loading";
import { useGeneration } from "@/contexts/generation-context";
import { generationProgressTexts } from "@/lib/generation/generation-progress-texts";
import type { GenerationPhase } from "@/lib/generation/chat-message-types";

type ChatAssistantTurnProps = {
  message: IdentiqUIMessage;
  isStreaming: boolean;
  messageIndex: number;
  /** Library remix canvas owns skeleton/result display. */
  hideRemixVisuals?: boolean;
  /** Used when stream ended before message parts were merged. */
  fallbackImageResult?: ImageResultData | null;
};

const ACTIVE_GENERATION_PHASES: GenerationPhase[] = [
  "composing-prompt",
  "orchestrating",
  "generating-image",
  "finalizing-asset",
];

function isActiveGenerationPhase(phase?: GenerationPhase | string | null): boolean {
  return Boolean(phase && ACTIVE_GENERATION_PHASES.includes(phase as GenerationPhase));
}

export function ChatAssistantTurn({
  message,
  isStreaming,
  messageIndex,
  hideRemixVisuals = false,
  fallbackImageResult = null,
}: ChatAssistantTurnProps) {
  const {
    continueFromMessageIndex,
    isGenerating,
    generationStartedAt,
    libraryTemplateId,
    aspectRatio: sessionAspectRatio,
    quantity: sessionQuantity,
    submitGeneration,
    resolution,
    referenceImages,
  } = useGeneration();
  const isLibraryRemix = Boolean(libraryTemplateId);
  const {
    generationStatus,
    imageResult: messageImageResult,
    errorText,
  } = parseAssistantMessage(message);
  const imageResult = messageImageResult ?? fallbackImageResult ?? null;

  const phase = generationStatus?.phase;
  const isFailed =
    (phase === "error" || Boolean(errorText?.trim())) && !imageResult;
  const showStopped = phase === "stopped";
  const showProgressSkeleton =
    !hideRemixVisuals &&
    !imageResult &&
    !showStopped &&
    (isFailed ||
      (isStreaming &&
        (isActiveGenerationPhase(phase) ||
          (!phase && !imageResult))));
  const skeletonAspectRatio =
    generationStatus?.aspectRatio ?? sessionAspectRatio;
  const skeletonQuantity = generationStatus?.quantity ?? sessionQuantity;
  const inlineError = formatInlineGenerationError(
    errorText ?? generationStatus?.errorMessage,
  );

  const progressTexts = useMemo(
    () =>
      generationProgressTexts({
        phase: phase ?? "orchestrating",
        presetTitle: generationStatus?.presetTitle,
        isLibraryRemix,
      }),
    [phase, generationStatus?.presetTitle, isLibraryRemix],
  );
  const remixPreviewUrl = isLibraryRemix
    ? referenceImages.find((img) => img.name === "Template")?.previewUrl ??
      referenceImages[0]?.previewUrl
    : undefined;

  return (
    <div className="group flex w-full justify-start">
      <div className="w-full space-y-3">
        {!isLibraryRemix ? (
          <div className="flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => void continueFromMessageIndex(messageIndex)}
              className="cursor-pointer text-xs text-muted underline hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue from here
            </button>
          </div>
        ) : null}

        {showProgressSkeleton ? (
          <div className="space-y-2">
            {isFailed ? (
              <p className="text-sm text-muted">{inlineError}</p>
            ) : null}
            <ImageSkeletonGrid
              aspectRatio={skeletonAspectRatio}
              quantity={skeletonQuantity}
              mediaTypeLabel={generationStatus?.presetTitle}
              remixPreviewUrl={remixPreviewUrl}
              imageModel={generationStatus?.imageModel}
              displayDimensions={generationStatus?.displayDimensions}
              elapsedStartedAt={isFailed ? null : generationStartedAt}
              animated={!isFailed}
              failed={isFailed}
              centered={false}
              onRetry={isFailed ? () => void submitGeneration() : undefined}
              progressTexts={isFailed ? undefined : progressTexts}
              phase={phase ?? "orchestrating"}
              resolution={resolution}
            />
            {generationStatus?.warningMessage ? (
              <p className="text-xs text-muted">{generationStatus.warningMessage}</p>
            ) : null}
          </div>
        ) : null}

        {imageResult && !hideRemixVisuals ? (
          <GeneratedImageCard data={imageResult} />
        ) : null}

        {showStopped ? (
          <p className="text-sm text-muted">Generation stopped.</p>
        ) : null}

        {!showProgressSkeleton &&
        !imageResult &&
        !showStopped &&
        isStreaming ? (
          <AITextLoading
            texts={progressTexts}
            size="sm"
            compact
            interval={1400}
          />
        ) : null}
      </div>
    </div>
  );
}
