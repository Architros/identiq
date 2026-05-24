"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ctaPrimary } from "@/components/ui/cta-styles";
import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";
import { loadDraftsMerged } from "@/lib/brand/brand-storage";

export function ContinueDraftBanner() {
  const [draft, setDraft] = useState<BrandProjectDraft | null>(null);

  useEffect(() => {
    void (async () => {
      const drafts = await loadDraftsMerged();
      const latest = drafts.find((d) => d.status === "draft");
      if (latest?.name.trim()) {
        setDraft(latest);
      } else if (latest) {
        setDraft(latest);
      }
    })();
  }, []);

  if (!draft) return null;

  return (
    <div className="rounded-[var(--radius-card)] border border-accent/30 bg-accent/[0.06] px-4 py-3">
      <p className="text-sm font-medium text-foreground">
        Continue your brand draft
        {draft.name.trim() ? `: ${draft.name}` : ""}
      </p>
      <p className="mt-1 text-xs text-muted">
        Pick up where you left off — references and uploads are saved to your
        account.
      </p>
      <Link
        href={`/new-brand?draftId=${encodeURIComponent(draft.id)}`}
        className={ctaPrimary(
          "mt-3 inline-flex rounded-lg px-3 py-1.5 text-sm font-medium",
        )}
      >
        Resume wizard
      </Link>
    </div>
  );
}
