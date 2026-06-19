"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGeneration } from "@/contexts/generation-context";
import { ChatWelcomeEmpty } from "@/components/generation/chat/chat-welcome-empty";
import { ChatUserBubble } from "@/components/generation/chat/chat-user-bubble";
import { ChatAssistantTurn } from "@/components/generation/chat/chat-assistant-turn";
import { ChatGenerationProgress } from "@/components/generation/chat/chat-generation-progress";
import { RemixResultCanvas } from "@/components/generation/chat/remix-result-canvas";
import { parseAssistantMessage } from "@/lib/generation/parse-assistant-message";
import { cn } from "@/lib/utils";

export function ChatMessageList({
  compactFooter = false,
}: {
  /** Slimmer footer (library remix) — less scroll padding. */
  compactFooter?: boolean;
}) {
  const {
    messages,
    isGenerating,
    generationPhase,
    generationError,
    generationStartedAt,
    generationPresetTitle,
    latestImageResult,
    footerComposerExpanded,
    libraryTemplateId,
    aspectRatio,
    quantity,
    referenceImages,
    submitGeneration,
    pendingUserTurnText,
  } = useGeneration();
  const bottomRef = useRef<HTMLDivElement>(null);

  const isLibraryRemix = Boolean(libraryTemplateId);
  const lastMessage = messages[messages.length - 1];
  const showPendingUserTurn =
    Boolean(pendingUserTurnText?.trim()) &&
    (messages.length === 0 || lastMessage?.role !== "user");

  const imageResultFromMessages = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role !== "assistant") continue;
      const { imageResult } = parseAssistantMessage(message);
      if (imageResult) return imageResult;
    }
    return null;
  }, [messages]);

  const resolvedImageResult = latestImageResult ?? imageResultFromMessages;

  const hasPendingGenerationPhase =
    generationPhase !== null &&
    generationPhase !== "error" &&
    generationPhase !== "done" &&
    generationPhase !== "stopped";
  const generationActive = isGenerating || hasPendingGenerationPhase;
  const showInlineProgress =
    generationActive &&
    (!resolvedImageResult ||
      showPendingUserTurn ||
      !lastMessage ||
      lastMessage.role === "user");
  const showInlineFailure =
    !generationActive &&
    !resolvedImageResult &&
    (generationPhase === "error" || Boolean(generationError?.trim()));

  const showRemixCanvas =
    isLibraryRemix &&
    (generationActive ||
      showInlineFailure ||
      Boolean(resolvedImageResult));

  const showWelcome =
    messages.length === 0 &&
    !showInlineProgress &&
    !showInlineFailure &&
    !resolvedImageResult &&
    !(isLibraryRemix && (isGenerating || hasPendingGenerationPhase));

  const remixPreviewUrl = isLibraryRemix
    ? referenceImages.find((img) => img.name === "Template")?.previewUrl ??
      referenceImages[0]?.previewUrl
    : undefined;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating, generationPhase, showInlineFailure, resolvedImageResult]);

  const isPreGenerationEmptyState = messages.length === 0 && showWelcome;
  const scrollPadding = isPreGenerationEmptyState
    ? "pb-6"
    : compactFooter
      ? footerComposerExpanded
        ? "pb-44 scroll-pb-44"
        : "pb-[4.75rem] scroll-pb-[4.75rem]"
      : footerComposerExpanded
        ? "pb-28 scroll-pb-28"
        : "pb-[4.75rem] scroll-pb-[4.75rem]";

  const centerEmptyState =
    showWelcome && !isLibraryRemix && !showInlineFailure;

  return (
    <div
      className={cn(
        "h-full min-h-0 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-6 sm:py-5",
        isPreGenerationEmptyState && "overflow-hidden",
        scrollPadding,
        centerEmptyState && "flex flex-col justify-center",
        showRemixCanvas && "pt-4 sm:pt-6",
      )}
    >
      <div
        className={cn(
          "w-full space-y-6",
          isLibraryRemix
            ? showWelcome
              ? "mx-auto max-w-xl text-center"
              : "mx-auto max-w-2xl"
            : showWelcome
              ? "mx-auto max-w-xl text-center"
              : "mx-auto mr-auto max-w-2xl",
        )}
      >
        {showWelcome ? <ChatWelcomeEmpty /> : null}

        {showPendingUserTurn ? (
          <div className="flex justify-end">
            <div className="max-w-xl rounded-2xl bg-accent px-4 py-2.5 text-sm text-white">
              {pendingUserTurnText}
            </div>
          </div>
        ) : null}

        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const streaming = isGenerating && isLast && message.role === "assistant";
          const isLastAssistant =
            message.role === "assistant" &&
            !messages.slice(index + 1).some((m) => m.role === "assistant");

          if (message.role === "user") {
            return (
              <ChatUserBubble
                key={`${message.id}-${index}`}
                message={message}
                messageIndex={index}
              />
            );
          }

          return (
            <ChatAssistantTurn
              key={`${message.id}-${index}`}
              message={message}
              isStreaming={streaming}
              messageIndex={index}
              hideRemixVisuals={isLibraryRemix}
              fallbackImageResult={
                isLastAssistant ? resolvedImageResult : null
              }
            />
          );
        })}

        {showRemixCanvas ? (
          <div className="flex w-full justify-start">
            <RemixResultCanvas
              imageResult={resolvedImageResult}
              aspectRatio={aspectRatio}
              quantity={quantity}
              remixPreviewUrl={remixPreviewUrl}
              presetTitle={generationPresetTitle}
              isGenerating={generationActive && !resolvedImageResult}
              isFailed={showInlineFailure}
              errorMessage={generationError}
              elapsedStartedAt={generationStartedAt}
              onRetry={() => void submitGeneration()}
            />
          </div>
        ) : null}

        {!isLibraryRemix && (showInlineProgress || showInlineFailure) ? (
          <ChatGenerationProgress phase={generationPhase} />
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
