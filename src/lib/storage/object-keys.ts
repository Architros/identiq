/** Sanitize filename for object keys */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 120);
}

export function referenceObjectKey(
  draftId: string,
  attachmentId: string,
  filename: string,
): string {
  return `drafts/${draftId}/references/${attachmentId}-${sanitizeFilename(filename)}`;
}

export function brandReferenceObjectKey(
  brandId: string,
  referenceId: string,
  filename: string,
): string {
  return `brands/${brandId}/references/${referenceId}-${sanitizeFilename(filename)}`;
}

export function brandGeneratedImageKey(
  brandId: string,
  jobKey: string,
  extension: string,
): string {
  return `brands/${brandId}/generated/${jobKey}.${extension}`;
}

export function brandIdeasImageKey(
  brandId: string,
  jobId: string,
  extension: string,
): string {
  return `brands/${brandId}/ideas/${jobId}.${extension}`;
}

export function extensionForMediaType(mediaType: string): string {
  if (mediaType.includes("png")) return "png";
  if (mediaType.includes("webp")) return "webp";
  if (mediaType.includes("jpeg") || mediaType.includes("jpg")) return "jpg";
  if (mediaType.includes("pdf")) return "pdf";
  if (mediaType.includes("markdown")) return "md";
  if (mediaType.includes("plain")) return "txt";
  return "bin";
}
