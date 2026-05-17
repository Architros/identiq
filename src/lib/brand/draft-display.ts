import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";
import { WIZARD_STEP_LABELS } from "@/lib/brand/brand-project-draft";

export function formatDraftUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function draftProgressLabel(draft: BrandProjectDraft): string {
  const step = Math.min(draft.step, WIZARD_STEP_LABELS.length - 1);
  return `Step ${step + 1} of ${WIZARD_STEP_LABELS.length} · ${WIZARD_STEP_LABELS[step]}`;
}

export function draftDisplayTitle(draft: BrandProjectDraft): string {
  if (draft.name.trim()) return draft.name.trim();
  if (draft.domain.trim()) return draft.domain.trim();
  return "Untitled brand draft";
}
