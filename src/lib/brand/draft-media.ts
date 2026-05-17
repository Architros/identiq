import type { BrandAttachment, BrandProjectDraft } from "@/lib/brand/brand-project-draft";
import { getAttachmentKind } from "@/lib/brand/attachment-utils";

export function getDraftLogoUrl(draft: BrandProjectDraft): string | undefined {
  const logo = draft.logo;
  if (!logo?.url) return undefined;
  if (logo.uploading || logo.uploadError) return undefined;
  return logo.url;
}

/** Image reference URLs for generation (excludes uploaded logo). */
export function getDraftReferenceImageUrls(draft: BrandProjectDraft): string[] {
  const urls: string[] = [];
  const logoId = draft.logo?.id;

  for (const attachment of draft.attachments) {
    if (attachment.id === logoId) continue;
    if (attachment.uploading || attachment.uploadError || !attachment.url) continue;
    if (getAttachmentKind(attachment) !== "image") continue;
    urls.push(attachment.url);
  }

  return urls;
}

export function getDraftReferenceImageNames(draft: BrandProjectDraft): string[] {
  const names: string[] = [];
  const logoId = draft.logo?.id;

  for (const attachment of draft.attachments) {
    if (attachment.id === logoId) continue;
    if (attachment.uploading || attachment.uploadError || !attachment.url) continue;
    if (getAttachmentKind(attachment) !== "image") continue;
    names.push(attachment.name);
  }

  return names;
}

export function attachmentDisplaySource(attachment: BrandAttachment): string | undefined {
  return attachment.url ?? attachment.previewUrl;
}
