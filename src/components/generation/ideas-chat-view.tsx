"use client";

import { ChatHeader } from "@/components/generation/chat/chat-header";
import { ChatMessageList } from "@/components/generation/chat/chat-message-list";
import { ChatComposer } from "@/components/generation/chat/chat-composer";

export function IdeasChatView() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <ChatHeader />
      <ChatMessageList />
      <ChatComposer />
    </div>
  );
}
