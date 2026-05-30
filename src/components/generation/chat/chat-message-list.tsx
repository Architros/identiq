"use client";

import { useEffect, useRef } from "react";
import { useGeneration } from "@/contexts/generation-context";
import { ChatWelcomeEmpty } from "@/components/generation/chat/chat-welcome-empty";
import { ChatUserBubble } from "@/components/generation/chat/chat-user-bubble";
import { ChatAssistantTurn } from "@/components/generation/chat/chat-assistant-turn";
import { ChatGenerationProgress } from "@/components/generation/chat/chat-generation-progress";
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
    libraryTemplateId,
  } = useGeneration();
  const bottomRef = useRef<HTMLDivElement>(null);

  const isLibraryRemix = Boolean(libraryTemplateId);
  const lastMessage = messages[messages.length - 1];
  const showInlineProgress =
    isGenerating && (!lastMessage || lastMessage.role === "user");
  const showInlineFailure =
    !isGenerating &&
    (generationPhase === "error" || Boolean(generationError?.trim())) &&
    (!lastMessage || lastMessage.role === "user");
  const showWelcome =
    messages.length === 0 && !showInlineProgress && !showInlineFailure;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating, generationPhase, showInlineFailure]);

  const scrollPadding = compactFooter
    ? "pb-44 scroll-pb-44"
    : "pb-28 scroll-pb-28";

  const centerEmptyState =
    showWelcome && !isLibraryRemix && !showInlineFailure;
  const libraryRemixStatus =
    isLibraryRemix && (showInlineProgress || showInlineFailure);

  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5",
        scrollPadding,
        centerEmptyState && "flex flex-col justify-center",
        libraryRemixStatus && "pt-6 sm:pt-10",
      )}
    >
      <div
        className={cn(
          "mx-auto w-full space-y-6",
          isLibraryRemix || showWelcome
            ? "max-w-xl text-center"
            : "mr-auto max-w-2xl",
          libraryRemixStatus && "flex flex-col items-center",
        )}
      >
        {showWelcome ? <ChatWelcomeEmpty /> : null}

        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const streaming = isGenerating && isLast && message.role === "assistant";

          if (message.role === "user") {
            return (
              <ChatUserBubble
                key={message.id}
                message={message}
                messageIndex={index}
              />
            );
          }

          return (
            <ChatAssistantTurn
              key={message.id}
              message={message}
              isStreaming={streaming}
              messageIndex={index}
            />
          );
        })}

        {showInlineProgress || showInlineFailure ? (
          <ChatGenerationProgress phase={generationPhase} />
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
