import type {
  IdentiqUIMessage,
  ImageResultData,
} from "@/lib/generation/chat-message-types";

export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: IdentiqUIMessage["parts"];
  metadata?: IdentiqUIMessage["metadata"];
};

export function sanitizeMessagePartsForStorage(
  parts: IdentiqUIMessage["parts"],
): IdentiqUIMessage["parts"] {
  if (!parts) return parts;

  return parts.map((part) => {
    if (part.type !== "data-image-result") return part;

    const data = part.data as ImageResultData;
    return {
      ...part,
      data: {
        ...data,
        images: data.images.map((img) => ({
          mediaType: img.mediaType,
          url: img.url,
          storageKey: img.storageKey,
        })),
      },
    };
  });
}

export function serializeIdentiqMessages(
  messages: IdentiqUIMessage[],
): StoredChatMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    parts: sanitizeMessagePartsForStorage(m.parts),
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
