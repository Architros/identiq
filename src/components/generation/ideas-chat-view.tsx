"use client";

import { ChatHeader } from "@/components/generation/chat/chat-header";
import { ChatMessageList } from "@/components/generation/chat/chat-message-list";
import { ChatComposer } from "@/components/generation/chat/chat-composer";
import { GenerationHistoryPanel } from "@/components/generation/generation-history-panel";
import { useGeneration } from "@/contexts/generation-context";

export function IdeasChatView() {
  const { historyOpen, setHistoryOpen } = useGeneration();

  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col">
        <ChatHeader />
        <ChatMessageList />
        <ChatComposer />
      </div>
      <GenerationHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}
