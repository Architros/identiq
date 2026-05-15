"use client";

import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";
import { parseAssistantMessage } from "@/lib/generation/parse-assistant-message";
import { ThinkingBlock } from "@/components/generation/chat/thinking-block";
import { ImageSkeletonGrid } from "@/components/generation/chat/image-skeleton-grid";
import { GeneratedImageCard } from "@/components/generation/chat/generated-image-card";

type ChatAssistantTurnProps = {
  message: IdentiqUIMessage;
  isStreaming: boolean;
};

export function ChatAssistantTurn({
  message,
  isStreaming,
}: ChatAssistantTurnProps) {
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
  const showError =
    phase === "error" || Boolean(errorText);

  return (
    <div className="flex justify-start">
      <div className="max-w-2xl w-full space-y-3">
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
          />
        ) : null}

        {imageResult ? <GeneratedImageCard data={imageResult} /> : null}

        {showStopped ? (
          <p className="text-sm text-muted">Generation stopped.</p>
        ) : null}

        {showError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {generationStatus?.errorMessage ??
              errorText ??
              "Generation failed"}
          </p>
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
