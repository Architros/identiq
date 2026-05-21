"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import type { LibraryTemplate } from "@/lib/library/types";

type LibraryTemplateModalProps = {
  template: LibraryTemplate | null;
  onClose: () => void;
};

export function LibraryTemplateModal({
  template,
  onClose,
}: LibraryTemplateModalProps) {
  useEffect(() => {
    if (!template) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [template, onClose]);

  if (!template) return null;

  const remixHref = `/images?libraryId=${encodeURIComponent(template.id)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/55 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Library template preview"
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 cursor-pointer rounded-full bg-surface/90 p-2 text-muted shadow-md ring-1 ring-border/80 hover:text-foreground"
          aria-label="Close"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={18}
            color="currentColor"
            strokeWidth={1.75}
          />
        </button>

        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-background p-4 pt-12">
          <Image
            src={template.imageUrl}
            alt=""
            width={template.width ?? 1200}
            height={template.height ?? 1500}
            className="max-h-[min(70vh,900px)] w-auto max-w-full object-contain"
            unoptimized
            priority
          />
        </div>

        <div className="border-t border-border bg-surface px-4 py-4">
          <Link
            href={remixHref}
            className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            Remix with my brand
          </Link>
        </div>
      </div>
    </div>
  );
}
