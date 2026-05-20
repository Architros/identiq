"use client";

import { useEffect, useRef } from "react";
import { useGeneration } from "@/contexts/generation-context";
import { ChatUserBubble } from "@/components/generation/chat/chat-user-bubble";
import { ChatAssistantTurn } from "@/components/generation/chat/chat-assistant-turn";

export function ChatMessageList() {
  const { messages, isGenerating } = useGeneration();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  return (
    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto scroll-pb-36 px-6 py-6 pb-40">
      {messages.length === 0 ? (
        <p className="text-center text-sm text-muted">
          Your generation will appear here.
        </p>
      ) : (
        messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const streaming = isGenerating && isLast && message.role === "assistant";

          if (message.role === "user") {
            return (
              <ChatUserBubble key={message.id} message={message} messageIndex={index} />
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
        })
      )}
      <div ref={bottomRef} />
    </div>
  );
}
