"use client";

import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";
import { useGeneration } from "@/contexts/generation-context";

type ChatUserBubbleProps = {
  message: IdentiqUIMessage;
  messageIndex: number;
};

export function ChatUserBubble({ message, messageIndex }: ChatUserBubbleProps) {
  const { continueFromMessageIndex, isGenerating, libraryTemplateId } = useGeneration();
  const isLibraryRemix = Boolean(libraryTemplateId);
  const text = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  if (!text.trim()) return null;

  return (
    <div className="group flex justify-end">
      <div className="max-w-xl space-y-1">
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
        <div className="rounded-2xl bg-accent px-4 py-2.5 text-sm text-white">
          {text}
        </div>
      </div>
    </div>
  );
}
