"use client";

import { useCallback, useEffect, useState } from "react";
import { useGeneration } from "@/contexts/generation-context";
import type { IdeasChatSummary } from "@/lib/generation/ideas-chat-types";
import { formatRelativeTime } from "@/lib/generation/format-elapsed";
import { cn } from "@/lib/utils";

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
    setChats(list);
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
            <p className="px-2 py-4 text-sm text-muted">Loading…</p>
          ) : chats.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted">
              No saved chats yet. Start a generation to create one.
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
                    <p className="mt-0.5 text-xs text-muted">
                      {formatRelativeTime(chat.updatedAt)}
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
