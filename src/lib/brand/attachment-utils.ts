import type { BrandAttachment } from "@/lib/brand/brand-project-draft";

export const ATTACHMENT_MAX_FILES = 8;
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/** Raster images only — SVG uploads are not supported. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const ATTACHMENT_ACCEPT = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  "text/plain",
  "text/markdown",
  ".md",
  ".txt",
].join(",");

export type AttachmentKind = "image" | "text" | "other";

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

export function isBlockedAttachmentType(
  type: string,
  name: string,
): boolean {
  const normalizedType = type.toLowerCase();
  const normalizedName = name.toLowerCase();
  return (
    normalizedType === "application/pdf" ||
    normalizedName.endsWith(".pdf") ||
    normalizedType === "image/svg+xml" ||
    normalizedName.endsWith(".svg")
  );
}

export function isAllowedRasterImageType(type: string, name?: string): boolean {
  const normalizedType = type.toLowerCase();
  if (
    ALLOWED_IMAGE_MIME_TYPES.includes(
      normalizedType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number],
    )
  ) {
    return true;
  }
  const normalizedName = name?.toLowerCase() ?? "";
  return /\.(png|jpe?g|webp)$/.test(normalizedName);
}

export function firstAllowedRasterImageFile(
  files: FileList | File[],
): File | null {
  for (const file of Array.from(files)) {
    if (isAllowedRasterImageType(file.type, file.name)) {
      return file;
    }
  }
  return null;
}

export function imageFileFromClipboard(
  clipboardData: DataTransfer | null,
): File | null {
  if (!clipboardData) return null;

  const items = clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (file && isAllowedRasterImageType(file.type, file.name)) {
      return file;
    }
  }

  return firstAllowedRasterImageFile(clipboardData.files);
}

export function isAllowedAttachmentFile(file: File): boolean {
  if (file.size > ATTACHMENT_MAX_BYTES) return false;
  if (isBlockedAttachmentType(file.type, file.name)) return false;
  if (isAllowedRasterImageType(file.type, file.name)) return true;

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    type.startsWith("text/") ||
    name.endsWith(".md") ||
    name.endsWith(".txt") ||
    name.endsWith(".markdown")
  );
}

export function getAttachmentKind(attachment: BrandAttachment): AttachmentKind {
  const type = attachment.type.toLowerCase();
  const name = attachment.name.toLowerCase();

  if (isBlockedAttachmentType(type, name)) return "other";
  if (isAllowedRasterImageType(type, name)) return "image";
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

  const counts = { image: 0, text: 0, other: 0 };
  for (const a of attachments) {
    counts[getAttachmentKind(a)] += 1;
  }

  const parts: string[] = [];
  if (counts.image) parts.push(`${counts.image} image${counts.image === 1 ? "" : "s"}`);
  if (counts.text) parts.push(`${counts.text} doc${counts.text === 1 ? "" : "s"}`);
  if (counts.other) parts.push(`${counts.other} other`);

  return parts.join(" · ");
}
