import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";
import { normalizeBrandDraft } from "@/lib/brand/normalize-draft";

export async function fetchDraftsFromServer(): Promise<BrandProjectDraft[]> {
  const res = await fetch("/api/drafts", { credentials: "same-origin" });
  if (!res.ok) return [];
  const data = (await res.json()) as { drafts?: BrandProjectDraft[] };
  return (data.drafts ?? []).map(normalizeBrandDraft);
}

/** Strip blob previews and in-flight upload fields before JSON POST. */
export function sanitizeDraftForServer(
  draft: BrandProjectDraft,
): BrandProjectDraft {
  return {
    ...draft,
    logo: draft.logo
      ? {
          ...draft.logo,
          previewUrl: draft.logo.url ?? undefined,
          uploading: undefined,
          uploadProgress: undefined,
          uploadError: undefined,
        }
      : null,
    attachments: draft.attachments.map((a) => ({
      ...a,
      previewUrl: a.url ?? undefined,
      uploading: undefined,
      uploadProgress: undefined,
      uploadError: undefined,
    })),
  };
}

export async function saveDraftToServer(
  draft: BrandProjectDraft,
): Promise<{ ok: boolean; error?: string }> {
  const next = sanitizeDraftForServer({
    ...draft,
    updatedAt: new Date().toISOString(),
  });
  try {
    const res = await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ draft: next }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: data.error ?? "Failed to save draft" };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to save draft",
    };
  }
}

export async function deleteDraftOnServer(draftId: string): Promise<void> {
  await fetch("/api/drafts", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ draftId }),
  });
}
