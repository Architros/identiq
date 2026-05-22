/** Fetch image bytes for download / ZIP (handles same-origin and CDN URLs). */
export async function fetchImageBlob(url: string): Promise<Blob> {
  const trimmed = url.trim();
  if (!trimmed) throw new Error("Missing image URL");

  if (trimmed.startsWith("data:")) {
    const res = await fetch(trimmed);
    return res.blob();
  }

  let sameOrigin = false;
  if (typeof window !== "undefined") {
    if (trimmed.startsWith("/")) {
      sameOrigin = true;
    } else {
      try {
        sameOrigin =
          new URL(trimmed).origin === window.location.origin;
      } catch {
        sameOrigin = false;
      }
    }
  }

  const res = await fetch(trimmed, {
    mode: "cors",
    credentials: sameOrigin ? "same-origin" : "omit",
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
