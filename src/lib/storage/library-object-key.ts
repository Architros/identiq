import { extensionForMediaType } from "@/lib/storage/object-keys";

export function libraryTemplateObjectKey(
  templateId: string,
  filename: string,
): string {
  const ext = extensionForMediaType(
    filename.endsWith(".jpg") || filename.endsWith(".jpeg")
      ? "image/jpeg"
      : filename.endsWith(".webp")
        ? "image/webp"
        : "image/png",
  );
  return `library/templates/${templateId}.${ext}`;
}
