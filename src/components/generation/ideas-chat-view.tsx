"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { TimeScheduleIcon } from "@hugeicons/core-free-icons";
import { ChatMessageList } from "@/components/generation/chat/chat-message-list";
import { ChatComposer } from "@/components/generation/chat/chat-composer";
import { GenerationHistoryPanel } from "@/components/generation/generation-history-panel";
import { useGeneration } from "@/contexts/generation-context";
import { cn } from "@/lib/utils";

export function IdeasChatView() {
  const { historyOpen, setHistoryOpen, libraryTemplateId } = useGeneration();
  const isLibraryRemix = Boolean(libraryTemplateId);

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className={cn(
              "absolute right-4 top-4 z-10 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors sm:right-6 sm:top-5",
              "hover:bg-sidebar-active hover:text-foreground",
            )}
            aria-label="Generation history"
            title="Generation history"
          >
            <HugeiconsIcon
              icon={TimeScheduleIcon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
            />
          </button>
          <ChatMessageList compactFooter={isLibraryRemix} />
        </div>
        <ChatComposer />
      </div>
      <GenerationHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}
