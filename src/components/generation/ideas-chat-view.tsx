"use client";

import { ChatHeader } from "@/components/generation/chat/chat-header";
import { ChatMessageList } from "@/components/generation/chat/chat-message-list";
import { ChatComposer } from "@/components/generation/chat/chat-composer";
import { GenerationHistoryPanel } from "@/components/generation/generation-history-panel";
import { useGeneration } from "@/contexts/generation-context";

export function IdeasChatView() {
  const { historyOpen, setHistoryOpen, libraryTemplateId } = useGeneration();
  const isLibraryRemix = Boolean(libraryTemplateId);

  return (
    <>
      <div className="grid h-[calc(100dvh-var(--dashboard-topbar-height,3.5rem))] min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden">
        <ChatHeader />
        <ChatMessageList compactFooter={isLibraryRemix} />
        <ChatComposer />
      </div>
      <GenerationHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}
