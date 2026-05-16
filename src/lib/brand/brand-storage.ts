import type { BrandKit } from "@/lib/brand/types";
import type { BrandSummary } from "@/lib/brand/brands";
import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";

const DRAFTS_KEY = "identiq_brand_drafts";
const BRANDS_KEY = "identiq_user_brands";
const SUMMARIES_KEY = "identiq_user_brand_summaries";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadDrafts(): BrandProjectDraft[] {
  return readJson<BrandProjectDraft[]>(DRAFTS_KEY, []);
}

export function saveDraft(draft: BrandProjectDraft) {
  const drafts = loadDrafts().filter((d) => d.id !== draft.id);
  writeJson(DRAFTS_KEY, [
    { ...draft, updatedAt: new Date().toISOString() },
    ...drafts,
  ]);
}

export function getDraftById(id: string): BrandProjectDraft | undefined {
  return loadDrafts().find((d) => d.id === id);
}

export function getLatestIncompleteDraft(): BrandProjectDraft | undefined {
  return loadDrafts().find((d) => d.status === "draft");
}

export function deleteDraft(id: string) {
  writeJson(
    DRAFTS_KEY,
    loadDrafts().filter((d) => d.id !== id),
  );
}

export function loadUserBrandKits(): Record<string, BrandKit> {
  return readJson<Record<string, BrandKit>>(BRANDS_KEY, {});
}

export function loadUserBrandSummaries(): BrandSummary[] {
  return readJson<BrandSummary[]>(SUMMARIES_KEY, []);
}

export function saveUserBrand(kit: BrandKit, summary: BrandSummary) {
  const kits = loadUserBrandKits();
  kits[kit.id] = kit;
  writeJson(BRANDS_KEY, kits);

  const summaries = loadUserBrandSummaries().filter((s) => s.id !== kit.id);
  writeJson(SUMMARIES_KEY, [summary, ...summaries]);
}
