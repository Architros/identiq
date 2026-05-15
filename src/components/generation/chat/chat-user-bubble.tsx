"use client";

import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";

type ChatUserBubbleProps = {
  message: IdentiqUIMessage;
};

export function ChatUserBubble({ message }: ChatUserBubbleProps) {
  const text =
    message.parts
      ?.filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("") ?? "";

  const presetTitles = message.metadata?.presetTitles ?? [];

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] space-y-2 rounded-2xl rounded-br-md bg-accent/10 px-4 py-3">
        {presetTitles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {presetTitles.map((title) => (
              <span
                key={title}
                className="rounded-full border border-accent/30 bg-accent/5 px-2 py-0.5 text-xs font-medium text-accent"
              >
                {title}
              </span>
            ))}
          </div>
        ) : null}
        <p className="text-sm leading-relaxed text-foreground">{text}</p>
      </div>
    </div>
  );
}
