"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";
import { loadDraftsMerged, deleteDraft } from "@/lib/brand/brand-storage";
import {
  draftDisplayTitle,
  draftProgressLabel,
  formatDraftUpdatedAt,
} from "@/lib/brand/draft-display";

export function DraftsSection() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<BrandProjectDraft[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const merged = await loadDraftsMerged();
    setDrafts(merged.filter((d) => d.status === "draft"));
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
    const onFocus = () => void reload();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [reload]);

  if (loading) {
    return (
      <section className="rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3">
        <p className="text-sm text-muted">Loading your drafts…</p>
      </section>
    );
  }

  if (drafts.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-[var(--radius-card)] border border-border bg-surface"
      aria-label="Brand drafts"
    >
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          Your brand drafts
        </h2>
        <p className="mt-0.5 text-xs text-muted">
          In-progress projects from Save &amp; exit — resume anytime.
        </p>
      </div>
      <ul className="divide-y divide-border">
        {drafts.map((draft) => (
          <li key={draft.id} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {draftDisplayTitle(draft)}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {draftProgressLabel(draft)}
                {formatDraftUpdatedAt(draft.updatedAt)
                  ? ` · ${formatDraftUpdatedAt(draft.updatedAt)}`
                  : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href={`/new-brand?draftId=${encodeURIComponent(draft.id)}`}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-sidebar-active"
              >
                Resume
              </Link>
              <button
                type="button"
                onClick={() => {
                  deleteDraft(draft.id);
                  void reload();
                }}
                className="rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-sidebar-active hover:text-foreground"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-border px-4 py-2">
        <button
          type="button"
          onClick={() => router.push("/new-brand")}
          className="text-xs font-medium text-accent hover:underline"
        >
          Start a new brand
        </button>
      </div>
    </section>
  );
}
