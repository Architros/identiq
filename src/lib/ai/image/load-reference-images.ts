import "server-only";

const MAX_REFERENCE_IMAGES = 4;
const FETCH_TIMEOUT_MS = 15_000;

export async function loadReferenceImagesFromUrls(
  urls: string[],
): Promise<Uint8Array[]> {
  const unique = [...new Set(urls.filter(Boolean))].slice(0, MAX_REFERENCE_IMAGES);
  const buffers: Uint8Array[] = [];

  for (const url of unique) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > 0) buffers.push(buf);
    } catch {
      // Skip unreachable references; prompt still lists URLs.
    }
  }

  return buffers;
}
