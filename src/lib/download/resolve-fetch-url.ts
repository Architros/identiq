/** Client-side URL for fetching asset bytes (proxies cross-origin CDN URLs). */
export function resolveAssetFetchUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  if (typeof window === "undefined") {
    return trimmed;
  }

  try {
    const origin = window.location.origin;
    if (new URL(trimmed).origin === origin) {
      return trimmed;
    }
  } catch {
    return trimmed;
  }

  return `/api/assets/fetch?url=${encodeURIComponent(trimmed)}`;
}
