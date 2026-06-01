"use client";

import { useCallback, useEffect, useState } from "react";
import { useGeneration } from "@/contexts/generation-context";
import type { IdeasChatSummary } from "@/lib/generation/ideas-chat-types";
import { dedupeHistoryChatSummaries } from "@/lib/generation/chat-history";
import { formatRelativeTime } from "@/lib/generation/format-elapsed";
import { cn } from "@/lib/utils";

const SKELETON_ROW_COUNT = 5;

const skeletonBar =
  "animate-pulse rounded-md bg-gradient-to-r from-sidebar-active via-border/40 to-sidebar-active";

function HistoryRowSkeleton() {
  return (
    <li className="rounded-lg px-3 py-2.5" aria-hidden>
      <div className="space-y-2">
        <div className={cn(skeletonBar, "h-4 w-[58%] max-w-[220px]")} />
        <div className={cn(skeletonBar, "h-3 w-[36%] max-w-[140px]")} />
      </div>
    </li>
  );
}

type GenerationHistoryPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function GenerationHistoryPanel({
  open,
  onClose,
}: GenerationHistoryPanelProps) {
  const {
    activeChatId,
    refreshChatHistory,
    openChatSession,
    startNewChat,
  } = useGeneration();
  const [chats, setChats] = useState<IdeasChatSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await refreshChatHistory();
    setChats(dedupeHistoryChatSummaries(list));
    setLoading(false);
  }, [refreshChatHistory]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close history"
        className="fixed inset-0 z-40 cursor-pointer bg-foreground/20"
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-surface shadow-xl",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">
            Generation history
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-sm text-muted hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="border-b border-border px-4 py-2">
          <button
            type="button"
            onClick={() => {
              startNewChat();
              onClose();
            }}
            className="w-full cursor-pointer rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-sidebar-active"
          >
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <ul
              className="space-y-1"
              aria-busy="true"
              aria-label="Loading generation history"
            >
              {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
                <HistoryRowSkeleton key={index} />
              ))}
            </ul>
          ) : chats.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted">
              No saved generations yet. Complete a generation to see it here.
            </p>
          ) : (
            <ul className="space-y-1">
              {chats.map((chat) => (
                <li key={chat.id}>
                  <button
                    type="button"
                    onClick={() => void openChatSession(chat.id)}
                    className={cn(
                      "w-full cursor-pointer rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-sidebar-active",
                      activeChatId === chat.id && "bg-sidebar-active",
                    )}
                  >
                    <p className="truncate text-sm font-medium text-foreground">
                      {chat.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {chat.subtitle
                        ? `${chat.subtitle} · ${formatRelativeTime(chat.updatedAt)}`
                        : formatRelativeTime(chat.updatedAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
