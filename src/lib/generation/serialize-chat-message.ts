import type { IdentiqUIMessage } from "@/lib/generation/chat-message-types";

export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: IdentiqUIMessage["parts"];
  metadata?: IdentiqUIMessage["metadata"];
};

export function serializeIdentiqMessages(
  messages: IdentiqUIMessage[],
): StoredChatMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    parts: m.parts,
    metadata: m.metadata,
  }));
}

export function deserializeIdentiqMessages(
  stored: StoredChatMessage[],
): IdentiqUIMessage[] {
  return stored.map((m) => ({
    id: m.id,
    role: m.role,
    parts: m.parts,
    metadata: m.metadata,
  }));
}
