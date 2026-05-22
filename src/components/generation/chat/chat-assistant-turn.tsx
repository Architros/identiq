"use client";

import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";
import { parseAssistantMessage } from "@/lib/generation/parse-assistant-message";
import { formatInlineGenerationError } from "@/lib/generation/format-inline-generation-error";
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
          <p className="text-sm text-muted">
            {generationActivity ??
              (isLibraryRemix ? "Adapting layout to your brand…" : "Thinking…")}
          </p>
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
              onRetry={isFailed ? () => void submitGeneration() : undefined}
              activityLabel={
                isFailed
                  ? undefined
                  : generationActivityLabel({
                      phase: "generating-image",
                      presetTitle: generationStatus?.presetTitle,
                      isLibraryRemix,
                    })
              }
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
          <p className="text-sm text-muted">
            {generationActivity ?? "Working…"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
