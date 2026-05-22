"use client";

import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";
import { parseAssistantMessage } from "@/lib/generation/parse-assistant-message";
import { ThinkingBlock } from "@/components/generation/chat/thinking-block";
import { ImageSkeletonGrid } from "@/components/generation/chat/image-skeleton-grid";
import { GeneratedImageCard } from "@/components/generation/chat/generated-image-card";
import { useGeneration } from "@/contexts/generation-context";
import { generationActivityLabel } from "@/lib/generation/generation-activity-label";

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
    generationActivity,
    aspectRatio: sessionAspectRatio,
    quantity: sessionQuantity,
  } = useGeneration();
  const isLibraryRemix = Boolean(libraryTemplateId);
  const {
    textContent,
    reasoningContent,
    generationStatus,
    imageResult,
  } = parseAssistantMessage(message);

  const phase = generationStatus?.phase;
  const hasThought =
    textContent.trim().length > 0 || reasoningContent.trim().length > 0;
  const isOrchestrating =
    phase === "orchestrating" ||
    phase === "composing-prompt" ||
    (isStreaming && !imageResult && phase !== "generating-image");
  const showThinking = hasThought || isOrchestrating;
  const showSkeleton = phase === "generating-image" && !imageResult;
  const showStopped = phase === "stopped";
  const skeletonAspectRatio =
    generationStatus?.aspectRatio ?? sessionAspectRatio;
  const skeletonQuantity = generationStatus?.quantity ?? sessionQuantity;

  return (
    <div className="group flex w-full justify-start">
      <div className="w-full space-y-3">
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

        {showThinking ? (
          <ThinkingBlock
            isStreaming={Boolean(isOrchestrating && isStreaming)}
            phase={phase}
            isLibraryRemix={isLibraryRemix}
            activityLabel={
              isOrchestrating && isStreaming
                ? (generationActivity ?? undefined)
                : undefined
            }
            textContent={textContent}
            reasoningContent={reasoningContent}
          />
        ) : null}

        {showSkeleton ? (
          <ImageSkeletonGrid
            aspectRatio={skeletonAspectRatio}
            quantity={skeletonQuantity}
            imageModel={generationStatus?.imageModel}
            displayDimensions={generationStatus?.displayDimensions}
            elapsedStartedAt={generationStartedAt}
            activityLabel={generationActivityLabel({
              phase: "generating-image",
              presetTitle: generationStatus?.presetTitle,
              isLibraryRemix,
            })}
          />
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
          <p className="text-sm text-muted">
            {generationActivity ?? "Working…"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
