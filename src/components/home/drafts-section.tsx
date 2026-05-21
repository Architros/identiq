"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";
import { loadDraftsMerged, deleteDraft } from "@/lib/brand/brand-storage";
import {
  draftDisplayTitle,
  draftProgressLabel,
  formatDraftUpdatedAt,
} from "@/lib/brand/draft-display";
import { cn } from "@/lib/utils";

const SKELETON_ROW_COUNT = 2;

const skeletonBar =
  "animate-pulse rounded-md bg-gradient-to-r from-sidebar-active via-border/40 to-sidebar-active";

function DraftRowSkeleton() {
  return (
    <li className="flex items-center gap-3 px-4 py-3" aria-hidden>
      <div className="min-w-0 flex-1 space-y-2">
        <div className={cn(skeletonBar, "h-4 w-[42%] max-w-[200px]")} />
        <div className={cn(skeletonBar, "h-3 w-[58%] max-w-[280px]")} />
      </div>
      <div className="flex shrink-0 gap-2">
        <div className={cn(skeletonBar, "h-8 w-16 rounded-lg")} />
        <div className={cn(skeletonBar, "h-8 w-14 rounded-lg")} />
      </div>
    </li>
  );
}

export function DraftsSection() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<BrandProjectDraft[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const isOpenRef = useRef(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const merged = await loadDraftsMerged();
    setDrafts(merged.filter((d) => d.status === "draft"));
    setLoading(false);
    setHasLoaded(true);
  }, []);

  const handleToggle = (event: React.SyntheticEvent<HTMLDetailsElement>) => {
    const open = event.currentTarget.open;
    setIsOpen(open);
    isOpenRef.current = open;
    if (open && !hasLoaded) {
      void reload();
    } else if (open && hasLoaded) {
      void reload();
    }
  };

  useEffect(() => {
    const onFocus = () => {
      if (isOpenRef.current && hasLoaded) {
        void reload();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [hasLoaded, reload]);

  if (hasLoaded && !loading && drafts.length === 0) {
    return null;
  }

  const countLabel =
    drafts.length === 1 ? "1 draft" : `${drafts.length} drafts`;

  return (
    <details
      className="group rounded-[var(--radius-card)] border border-border bg-surface"
      aria-label="Brand drafts"
      onToggle={handleToggle}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-3 px-4 py-3",
          "[&::-webkit-details-marker]:hidden",
          "hover:bg-sidebar-active/40",
        )}
      >
        <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
          Brand drafts
        </span>
        {isOpen && loading ? (
          <span
            className={cn(skeletonBar, "h-3 w-14 shrink-0")}
            aria-hidden
          />
        ) : hasLoaded ? (
          <span className="shrink-0 text-xs text-muted">{countLabel}</span>
        ) : null}
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-active text-muted transition-transform duration-200",
            "group-open:rotate-180",
          )}
          aria-hidden
        >
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={18}
            color="currentColor"
            strokeWidth={1.75}
          />
        </span>
      </summary>

      {isOpen ? (
        loading ? (
          <ul
            className="divide-y divide-border border-t border-border"
            aria-busy="true"
            aria-label="Loading brand drafts"
          >
            {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
              <DraftRowSkeleton key={i} />
            ))}
          </ul>
        ) : (
          <>
            <p className="border-t border-border px-4 pt-2 text-xs text-muted">
              In-progress projects from Save &amp; exit — resume anytime.
            </p>
            <ul className="divide-y divide-border">
              {drafts.map((draft) => (
                <li
                  key={draft.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
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
          </>
        )
      ) : null}
    </details>
  );
}
