"use client";

import { useEffect, useRef } from "react";
import { useGeneration } from "@/contexts/generation-context";
import { ChatUserBubble } from "@/components/generation/chat/chat-user-bubble";
import { ChatAssistantTurn } from "@/components/generation/chat/chat-assistant-turn";
import { ChatGenerationProgress } from "@/components/generation/chat/chat-generation-progress";

export function ChatMessageList() {
  const { messages, isGenerating, generationPhase, libraryTemplateId } =
    useGeneration();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating, generationPhase]);

  const lastMessage = messages[messages.length - 1];
  const showInlineProgress =
    isGenerating && (!lastMessage || lastMessage.role === "user");

  return (
    <div className="min-h-0 flex-1 overflow-y-auto scroll-pb-28 px-4 py-4 pb-28 sm:px-6 sm:py-5">
      <div className="mr-auto w-full max-w-2xl space-y-6">
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

        {showInlineProgress ? (
          <ChatGenerationProgress phase={generationPhase} />
        ) : null}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
