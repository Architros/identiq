import type { BrandKit } from "@/lib/brand/types";
import type { BrandSummary } from "@/lib/brand/brands";
import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";
import { normalizeBrandDraft } from "@/lib/brand/normalize-draft";
import {
  deleteDraftOnServer,
  fetchDraftsFromServer,
  saveDraftToServer,
} from "@/lib/brand/draft-persistence";

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

function writeLocalDraft(draft: BrandProjectDraft) {
  const next = normalizeBrandDraft(draft);
  const drafts = loadDrafts().filter((d) => d.id !== next.id);
  writeJson(DRAFTS_KEY, [next, ...drafts]);
}

export function loadDrafts(): BrandProjectDraft[] {
  return readJson<BrandProjectDraft[]>(DRAFTS_KEY, []);
}

export async function loadDraftsMerged(): Promise<BrandProjectDraft[]> {
  const local = loadDrafts();
  const remote = await fetchDraftsFromServer();
  const byId = new Map<string, BrandProjectDraft>();

  for (const d of local) {
    byId.set(d.id, normalizeBrandDraft(d));
  }
  for (const d of remote) {
    const existing = byId.get(d.id);
    if (!existing) {
      byId.set(d.id, d);
      continue;
    }
    const existingTime = Date.parse(existing.updatedAt) || 0;
    const remoteTime = Date.parse(d.updatedAt) || 0;
    byId.set(d.id, remoteTime >= existingTime ? d : existing);
  }

  return [...byId.values()].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
}

export function saveDraft(draft: BrandProjectDraft) {
  writeLocalDraft(draft);
  void saveDraftToServer(draft);
}

export async function saveDraftAndWait(
  draft: BrandProjectDraft,
): Promise<{ ok: boolean; error?: string }> {
  const next = normalizeBrandDraft({ ...draft, status: "draft" });
  writeLocalDraft(next);
  return saveDraftToServer(next);
}

export function getDraftById(id: string): BrandProjectDraft | undefined {
  return loadDrafts().find((d) => d.id === id);
}

export async function getDraftByIdMerged(
  id: string,
): Promise<BrandProjectDraft | undefined> {
  const drafts = await loadDraftsMerged();
  return drafts.find((d) => d.id === id);
}

export function getLatestIncompleteDraft(): BrandProjectDraft | undefined {
  return loadDrafts().find((d) => d.status === "draft");
}

export async function getLatestIncompleteDraftMerged(): Promise<
  BrandProjectDraft | undefined
> {
  const drafts = await loadDraftsMerged();
  return drafts.find((d) => d.status === "draft");
}

export function deleteDraft(id: string) {
  writeJson(
    DRAFTS_KEY,
    loadDrafts().filter((d) => d.id !== id),
  );
  void deleteDraftOnServer(id);
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
