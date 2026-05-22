import { resolveAssetFetchUrl } from "@/lib/download/resolve-fetch-url";

/** Fetch image bytes for download / ZIP (same-origin and CDN via API proxy). */
export async function fetchImageBlob(url: string): Promise<Blob> {
  const trimmed = url.trim();
  if (!trimmed) throw new Error("Missing image URL");

  const fetchUrl = resolveAssetFetchUrl(trimmed);
  const proxied = fetchUrl !== trimmed;

  const res = await fetch(fetchUrl, {
    mode: proxied ? "same-origin" : "cors",
    credentials: proxied ? "same-origin" : "omit",
  });

  if (!res.ok) {
    throw new Error(`Could not download image (${res.status})`);
  }

  return res.blob();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadImageUrl(
  url: string,
  filename: string,
): Promise<void> {
  const blob = await fetchImageBlob(url);
  downloadBlob(blob, filename);
}
