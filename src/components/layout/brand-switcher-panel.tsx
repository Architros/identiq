"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  Search01Icon,
  Image01Icon,
  File01Icon,
} from "@hugeicons/core-free-icons";
import { BrandAvatar } from "@/components/layout/brand-avatar";
import { AppModal } from "@/components/shared/app-modal";
import { useBrand } from "@/components/providers/brand-provider";
import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";
import { deleteDraft, loadDraftsMerged } from "@/lib/brand/brand-storage";
import {
  draftDisplayTitle,
  draftProgressLabel,
  formatDraftUpdatedAt,
} from "@/lib/brand/draft-display";
import type { BrandSummary } from "@/lib/brand/brands";
import { cn } from "@/lib/utils";

type BrandSwitcherPanelProps = {
  onClose: () => void;
};

const skeletonBar =
  "animate-pulse rounded-md bg-gradient-to-r from-sidebar-active via-border/40 to-sidebar-active";

function DraftRowSkeleton() {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5" aria-hidden>
      <div className={cn(skeletonBar, "h-8 w-8 shrink-0 rounded-lg")} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className={cn(skeletonBar, "h-3.5 w-[55%]")} />
        <div className={cn(skeletonBar, "h-3 w-[40%]")} />
      </div>
    </li>
  );
}

function sortBrandsActiveFirst(
  list: BrandSummary[],
  activeBrandId: string,
): BrandSummary[] {
  if (!activeBrandId) return list;
  return [...list].sort((a, b) => {
    if (a.id === activeBrandId) return -1;
    if (b.id === activeBrandId) return 1;
    return 0;
  });
}

export function BrandSwitcherPanel({ onClose }: BrandSwitcherPanelProps) {
  const router = useRouter();
  const { brands, activeBrandId, setActiveBrand, hasBrands } = useBrand();
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<BrandProjectDraft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [draftToDelete, setDraftToDelete] = useState<BrandProjectDraft | null>(
    null,
  );
  const [deletingDraft, setDeletingDraft] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadDrafts = useCallback(async () => {
    setDraftsLoading(true);
    try {
      const merged = await loadDraftsMerged();
      setDrafts(merged.filter((d) => d.status === "draft"));
    } catch {
      setDrafts([]);
    } finally {
      setDraftsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDrafts();
  }, [loadDrafts]);

  const filteredBrands = useMemo(() => {
    const q = query.toLowerCase().trim();
    const matched = q
      ? brands.filter(
          (brand) =>
            brand.domain.toLowerCase().includes(q) ||
            brand.displayName.toLowerCase().includes(q),
        )
      : brands;
    return sortBrandsActiveFirst(matched, activeBrandId);
  }, [brands, query, activeBrandId]);

  const filteredDrafts = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return drafts;
    return drafts.filter((draft) => {
      const title = draftDisplayTitle(draft).toLowerCase();
      return title.includes(q) || draft.domain.toLowerCase().includes(q);
    });
  }, [drafts, query]);

  const handleConfirmDeleteDraft = useCallback(async () => {
    if (!draftToDelete) return;
    setDeletingDraft(true);
    try {
      deleteDraft(draftToDelete.id);
      await loadDrafts();
      setDraftToDelete(null);
    } finally {
      setDeletingDraft(false);
    }
  }, [draftToDelete, loadDrafts]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !draftToDelete) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, draftToDelete]);

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 px-4 pt-20"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Switch brand"
          className="max-h-[min(80vh,640px)] w-full max-w-md overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-[0_16px_48px_rgba(0,0,0,0.12)]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="border-b border-border px-4 py-3">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                color="currentColor"
                strokeWidth={1.75}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search brands and drafts..."
                className="h-10 w-full cursor-text rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[min(60vh,520px)] overflow-y-auto px-2 py-2">
            <div>
              <p className="px-2 py-1.5 text-xs font-medium text-muted">
                Your Brands
              </p>
              {hasBrands ? (
                <ul className="flex flex-col gap-0.5">
                  {filteredBrands.map((brand) => {
                    const isCurrent = brand.id === activeBrandId;
                    return (
                      <li key={brand.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBrand(brand.id);
                            onClose();
                          }}
                          className={cn(
                            "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left",
                            isCurrent
                              ? "bg-accent/[0.08]"
                              : "hover:bg-sidebar-active/80",
                          )}
                        >
                          <BrandAvatar avatar={brand.avatar} />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {brand.domain || brand.displayName}
                              </span>
                              {isCurrent ? (
                                <span className="rounded border border-accent/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                                  Current
                                </span>
                              ) : null}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                            <span className="flex items-center gap-1">
                              <HugeiconsIcon
                                icon={Image01Icon}
                                size={14}
                                color="currentColor"
                                strokeWidth={1.75}
                              />
                              {brand.imageCount}
                            </span>
                            <span className="tabular-nums">
                              {brand.updatedAt}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-3 py-4 text-sm text-muted">
                  No completed brands yet.
                </p>
              )}

              {hasBrands && filteredBrands.length === 0 && query.trim() ? (
                <p className="px-3 py-4 text-center text-sm text-muted">
                  No brands match your search.
                </p>
              ) : null}
            </div>

            <div className="mt-2 border-t border-border pt-2">
              <p className="px-2 py-1.5 text-xs font-medium text-muted">
                Drafts
              </p>
              {draftsLoading ? (
                <ul
                  className="flex flex-col gap-0.5"
                  aria-busy="true"
                  aria-label="Loading drafts"
                >
                  <DraftRowSkeleton />
                  <DraftRowSkeleton />
                </ul>
              ) : filteredDrafts.length > 0 ? (
                <ul className="flex flex-col gap-0.5">
                  {filteredDrafts.map((draft) => (
                    <li key={draft.id} className="group/draft">
                      <div className="flex items-center gap-1 rounded-lg hover:bg-sidebar-active/80">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            router.push(
                              `/new-brand?draftId=${encodeURIComponent(draft.id)}`,
                            );
                          }}
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/[0.08] text-accent">
                            <HugeiconsIcon
                              icon={File01Icon}
                              size={16}
                              color="currentColor"
                              strokeWidth={1.75}
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {draftDisplayTitle(draft)}
                            </span>
                            <span className="block text-xs text-muted">
                              {draftProgressLabel(draft)}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs text-muted tabular-nums">
                            {formatDraftUpdatedAt(draft.updatedAt)}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDraftToDelete(draft)}
                          aria-label={`Delete draft ${draftDisplayTitle(draft)}`}
                          className={cn(
                            "mr-2 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted transition-opacity",
                            "opacity-0 group-hover/draft:opacity-100 focus-visible:opacity-100",
                            "hover:bg-background hover:text-foreground",
                          )}
                        >
                          <HugeiconsIcon
                            icon={Delete02Icon}
                            size={16}
                            color="currentColor"
                            strokeWidth={1.75}
                          />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-3 text-sm text-muted">
                  {query.trim()
                    ? "No drafts match your search."
                    : "No drafts in progress."}
                </p>
              )}
            </div>

            <div className="mt-2 border-t border-border pt-2">
              <p className="px-2 py-1.5 text-xs font-medium text-muted">
                Actions
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push("/new-brand");
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-sidebar-active"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-active text-muted">
                  <HugeiconsIcon
                    icon={Add01Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={2}
                  />
                </span>
                Add New Brand
              </button>
            </div>
          </div>
        </div>
      </div>

      <AppModal
        elevated
        open={draftToDelete != null}
        onClose={() => {
          if (!deletingDraft) setDraftToDelete(null);
        }}
        title="Delete draft?"
        description={
          draftToDelete
            ? `“${draftDisplayTitle(draftToDelete)}” will be removed from your account. This cannot be undone.`
            : undefined
        }
        panelClassName="max-w-md"
        titleId="delete-draft-title"
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={deletingDraft}
            onClick={() => setDraftToDelete(null)}
            className="cursor-pointer rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-sidebar-active disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deletingDraft}
            onClick={() => void handleConfirmDeleteDraft()}
            className="cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {deletingDraft ? "Deleting…" : "Delete draft"}
          </button>
        </div>
      </AppModal>
    </>
  );
}
