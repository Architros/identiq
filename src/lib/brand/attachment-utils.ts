import type { BrandAttachment } from "@/lib/brand/brand-project-draft";

export const ATTACHMENT_MAX_FILES = 8;
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_ACCEPT =
  "image/png,image/jpeg,image/webp,application/pdf,text/plain,text/markdown,.md,.txt";

export type AttachmentKind = "image" | "pdf" | "text" | "other";

/** Human-readable file size (e.g. `1.2 MB`, `840 KB`). */
export function formatAttachmentSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  }
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

export function getAttachmentKind(attachment: BrandAttachment): AttachmentKind {
  const type = attachment.type.toLowerCase();
  const name = attachment.name.toLowerCase();
  if (type.startsWith("image/")) return "image";
  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    type.startsWith("text/") ||
    name.endsWith(".md") ||
    name.endsWith(".txt") ||
    name.endsWith(".markdown")
  ) {
    return "text";
  }
  return "other";
}

export function summarizeAttachments(attachments: BrandAttachment[]): string {
  if (attachments.length === 0) return "No files";

  const counts = { image: 0, pdf: 0, text: 0, other: 0 };
  for (const a of attachments) {
    counts[getAttachmentKind(a)] += 1;
  }

  const parts: string[] = [];
  if (counts.image) parts.push(`${counts.image} image${counts.image === 1 ? "" : "s"}`);
  if (counts.pdf) parts.push(`${counts.pdf} PDF${counts.pdf === 1 ? "" : "s"}`);
  if (counts.text) parts.push(`${counts.text} doc${counts.text === 1 ? "" : "s"}`);
  if (counts.other) parts.push(`${counts.other} other`);

  return parts.join(" · ");
}
