"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import type { LibraryTemplate } from "@/lib/library/types";
import { cn } from "@/lib/utils";

type LibraryAdCardProps = {
  template: LibraryTemplate;
  onOpen: (template: LibraryTemplate) => void;
};

function hasStoredDimensions(
  template: LibraryTemplate,
): template is LibraryTemplate & { width: number; height: number } {
  return (
    typeof template.width === "number" &&
    template.width > 0 &&
    typeof template.height === "number" &&
    template.height > 0
  );
}

export function LibraryAdCard({ template, onOpen }: LibraryAdCardProps) {
  const stored = hasStoredDimensions(template);
  const [loadedRatio, setLoadedRatio] = useState<number | null>(
    stored ? template.width / template.height : null,
  );

  const aspectRatio =
    loadedRatio ?? (stored ? template.width / template.height : 4 / 5);

  const remixHref = `/images?libraryId=${encodeURIComponent(template.id)}`;

  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-xl",
        "bg-muted/20 shadow-sm ring-1 ring-border/60",
        "transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-accent/30",
      )}
      style={{ aspectRatio }}
    >
      <button
        type="button"
        onClick={() => onOpen(template)}
        className={cn(
          "relative block h-full w-full cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
        )}
        aria-label="View template"
      >
        <Image
          src={template.imageUrl}
          alt=""
          width={stored ? template.width : 800}
          height={stored ? template.height : 1000}
          className="h-full w-full object-contain"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
          unoptimized
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              setLoadedRatio(img.naturalWidth / img.naturalHeight);
            }
          }}
        />

        <div
          className={cn(
            "pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200",
            "group-hover:bg-black/20",
          )}
          aria-hidden
        />
      </button>

      <Link
        href={remixHref}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full",
          "bg-white/95 text-foreground shadow-md ring-1 ring-border/60",
          "opacity-0 transition-opacity duration-200",
          "hover:bg-white focus-visible:opacity-100",
          "group-hover:opacity-100",
        )}
        aria-label="Remix with my brand"
        title="Remix with my brand"
      >
        <HugeiconsIcon
          icon={SparklesIcon}
          size={18}
          color="currentColor"
          strokeWidth={1.75}
        />
      </Link>
    </div>
  );
}
