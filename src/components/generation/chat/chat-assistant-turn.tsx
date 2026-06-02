"use client";

import { useMemo } from "react";
import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";
import { parseAssistantMessage } from "@/lib/generation/parse-assistant-message";
import { formatInlineGenerationError } from "@/lib/generation/format-inline-generation-error";
import { ImageSkeletonGrid } from "@/components/generation/chat/image-skeleton-grid";
import { GeneratedImageCard } from "@/components/generation/chat/generated-image-card";
import { AITextLoading } from "@/components/ui/ai-text-loading";
import { useGeneration } from "@/contexts/generation-context";
import { generationProgressTexts } from "@/lib/generation/generation-progress-texts";

type ChatAssistantTurnProps = {
  message: IdentiqUIMessage;
  isStreaming: boolean;
  messageIndex: number;
};

export function ChatAssistantTurn({
  message,
  isStreaming,
  messageIndex,
}: ChatAssistantTurnProps) {
  const {
    continueFromMessageIndex,
    isGenerating,
    generationStartedAt,
    libraryTemplateId,
    aspectRatio: sessionAspectRatio,
    quantity: sessionQuantity,
    submitGeneration,
  } = useGeneration();
  const isLibraryRemix = Boolean(libraryTemplateId);
  const {
    generationStatus,
    imageResult,
    errorText,
  } = parseAssistantMessage(message);

  const phase = generationStatus?.phase;
  const isOrchestrating =
    phase === "orchestrating" ||
    phase === "composing-prompt" ||
    (isStreaming && !imageResult && phase !== "generating-image");
  const isFailed = phase === "error" || Boolean(errorText?.trim());
  const showThinking = isOrchestrating && isStreaming && !isFailed;
  const showSkeleton =
    (phase === "generating-image" && !imageResult) || (isFailed && !imageResult);
  const showStopped = phase === "stopped";
  const skeletonAspectRatio =
    generationStatus?.aspectRatio ?? sessionAspectRatio;
  const skeletonQuantity = generationStatus?.quantity ?? sessionQuantity;
  const inlineError = formatInlineGenerationError(
    errorText ?? generationStatus?.errorMessage,
  );

  const thinkingTexts = useMemo(
    () =>
      generationProgressTexts({
        phase: phase ?? "orchestrating",
        presetTitle: generationStatus?.presetTitle,
        isLibraryRemix,
      }),
    [phase, generationStatus?.presetTitle, isLibraryRemix],
  );
  const renderingTexts = useMemo(
    () =>
      generationProgressTexts({
        phase: "generating-image",
        presetTitle: generationStatus?.presetTitle,
        isLibraryRemix,
      }),
    [generationStatus?.presetTitle, isLibraryRemix],
  );

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

        {showThinking ? (
          <AITextLoading
            texts={thinkingTexts}
            size="sm"
            compact
            interval={1400}
          />
        ) : null}

        {showSkeleton ? (
          <div className="space-y-2">
            {isFailed ? (
              <p className="text-sm text-muted">{inlineError}</p>
            ) : null}
            <ImageSkeletonGrid
              aspectRatio={skeletonAspectRatio}
              quantity={skeletonQuantity}
              imageModel={generationStatus?.imageModel}
              displayDimensions={generationStatus?.displayDimensions}
              elapsedStartedAt={isFailed ? null : generationStartedAt}
              animated={!isFailed}
              failed={isFailed}
              centered={isLibraryRemix}
              onRetry={isFailed ? () => void submitGeneration() : undefined}
              progressTexts={isFailed ? undefined : renderingTexts}
            />
          </div>
        ) : null}

        {imageResult ? <GeneratedImageCard data={imageResult} /> : null}

        {showStopped ? (
          <p className="text-sm text-muted">Generation stopped.</p>
        ) : null}

        {!showThinking &&
        !showSkeleton &&
        !imageResult &&
        !showStopped &&
        isStreaming ? (
          <AITextLoading
            texts={thinkingTexts}
            size="sm"
            compact
            interval={1400}
          />
        ) : null}
      </div>
    </div>
  );
}
