"use client";

import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";
import { parseAssistantMessage } from "@/lib/generation/parse-assistant-message";
import { ThinkingBlock } from "@/components/generation/chat/thinking-block";
import { ImageSkeletonGrid } from "@/components/generation/chat/image-skeleton-grid";
import { GeneratedImageCard } from "@/components/generation/chat/generated-image-card";
import { UserFacingErrorAlert } from "@/components/shared/user-facing-error-alert";
import { useGeneration } from "@/contexts/generation-context";

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
  const { continueFromMessageIndex, isGenerating, generationStartedAt } =
    useGeneration();
  const {
    textContent,
    reasoningContent,
    generationStatus,
    imageResult,
    errorText,
  } = parseAssistantMessage(message);

  const phase = generationStatus?.phase;
  const hasThought =
    textContent.trim().length > 0 || reasoningContent.trim().length > 0;
  const isOrchestrating =
    phase === "orchestrating" ||
    (isStreaming && !imageResult && phase !== "generating-image");
  const showThinking = hasThought || isOrchestrating;
  const showSkeleton = phase === "generating-image" && !imageResult;
  const showStopped = phase === "stopped";
  const showError = phase === "error" || Boolean(errorText);

  return (
    <div className="group flex justify-start">
      <div className="max-w-2xl w-full space-y-3">
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
            textContent={textContent}
            reasoningContent={reasoningContent}
          />
        ) : null}

        {showSkeleton ? (
          <ImageSkeletonGrid
            aspectRatio={generationStatus?.aspectRatio ?? "16:9"}
            quantity={generationStatus?.quantity ?? 1}
            imageModel={generationStatus?.imageModel}
            displayDimensions={generationStatus?.displayDimensions}
            elapsedStartedAt={generationStartedAt}
          />
        ) : null}

        {imageResult ? <GeneratedImageCard data={imageResult} /> : null}

        {showStopped ? (
          <p className="text-sm text-muted">Generation stopped.</p>
        ) : null}

        {showError ? (
          <UserFacingErrorAlert
            message={
              generationStatus?.errorMessage ??
              errorText ??
              "Generation failed"
            }
          />
        ) : null}

        {!showThinking &&
        !showSkeleton &&
        !imageResult &&
        !showStopped &&
        !showError &&
        isStreaming ? (
          <p className="text-sm text-muted">Working…</p>
        ) : null}
      </div>
    </div>
  );
}
