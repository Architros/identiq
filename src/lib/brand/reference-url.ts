import type { BrandReference } from "@/lib/brand/types";

/** Stable key for deduping references that point at the same stored file. */
export function normalizeReferenceUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("blob:")) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return `${parsed.origin}${parsed.pathname}`.toLowerCase();
  } catch {
    return trimmed.split("?")[0].split("#")[0].toLowerCase();
  }
}

function referencePriority(ref: BrandReference): number {
  if (ref.source === "wizard") return 2;
  return 1;
}

/** Keep one reference per URL; prefer wizard uploads over Ideas/composer attaches. */
export function dedupeBrandReferencesByUrl(
  references: BrandReference[],
): BrandReference[] {
  const byUrl = new Map<string, BrandReference>();
  for (const ref of references) {
    const key = normalizeReferenceUrl(ref.url);
    if (!key) continue;
    const existing = byUrl.get(key);
    if (!existing) {
      byUrl.set(key, ref);
      continue;
    }
    const keepNew =
      referencePriority(ref) > referencePriority(existing) ||
      (referencePriority(ref) === referencePriority(existing) &&
        new Date(ref.createdAt).getTime() >
          new Date(existing.createdAt).getTime());
    if (keepNew) byUrl.set(key, ref);
  }
  return [...byUrl.values()].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
