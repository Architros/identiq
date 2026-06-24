import "server-only";

const MAX_REFERENCE_IMAGES = 4;
const FETCH_TIMEOUT_MS = 15_000;

export type LoadReferenceImagesResult = {
  buffers: Uint8Array[];
  loaded: number;
  failed: number;
  requested: number;
};

export async function loadReferenceImagesFromUrls(
  urls: string[],
): Promise<LoadReferenceImagesResult> {
  const unique = [...new Set(urls.filter(Boolean))].slice(0, MAX_REFERENCE_IMAGES);

  const results = await Promise.all(
    unique.map(async (url) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const buf = new Uint8Array(await res.arrayBuffer());
        return buf.byteLength > 0 ? buf : null;
      } catch {
        return null;
      }
    }),
  );

  const buffers: Uint8Array[] = [];
  let failed = 0;
  for (const buf of results) {
    if (buf) buffers.push(buf);
    else failed += 1;
  }

  return {
    buffers,
    loaded: buffers.length,
    failed,
    requested: unique.length,
  };
}
