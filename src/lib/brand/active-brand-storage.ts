import type { BrandSummary } from "@/lib/brand/brands";
import { NO_BRAND_ID } from "@/lib/brand/empty-brand";

const LAST_ACTIVE_BRAND_KEY = "identiq_last_active_brand_id";

export function readLastActiveBrandId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_BRAND_KEY);
    return raw?.trim() || null;
  } catch {
    return null;
  }
}

export function writeLastActiveBrandId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    if (!id || id === NO_BRAND_ID) {
      localStorage.removeItem(LAST_ACTIVE_BRAND_KEY);
      return;
    }
    localStorage.setItem(LAST_ACTIVE_BRAND_KEY, id);
  } catch {
    // Ignore quota / private mode errors.
  }
}

/** Pick active brand: persisted preference, else most recently updated (first in list). */
export function pickDefaultBrandId(
  summaries: BrandSummary[],
  kits: Record<string, unknown>,
  persistedId?: string | null,
): string {
  if (summaries.length === 0) return NO_BRAND_ID;

  const validIds = new Set(
    summaries.filter((s) => s.id && kits[s.id]).map((s) => s.id),
  );

  if (persistedId && validIds.has(persistedId)) {
    return persistedId;
  }

  const fromList = summaries.find((s) => s.id && kits[s.id]);
  return fromList?.id ?? summaries[0]?.id ?? NO_BRAND_ID;
}
