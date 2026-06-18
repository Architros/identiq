"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { BrandGuardedLink } from "@/contexts/require-brand-context";
import type { LibraryTemplate } from "@/lib/library/types";
import { cn } from "@/lib/utils";

type LibraryAdCardProps = {
  template: LibraryTemplate;
  onOpen: (template: LibraryTemplate) => void;
  eager?: boolean;
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

export function LibraryAdCard({
  template,
  onOpen,
  eager = false,
}: LibraryAdCardProps) {
  const searchParams = useSearchParams();
  const title = template.title ?? "Template";
  const stored = hasStoredDimensions(template);
  const [loadedRatio, setLoadedRatio] = useState<number | null>(
    stored ? template.width / template.height : null,
  );

  const aspectRatio =
    loadedRatio ?? (stored ? template.width / template.height : 4 / 5);

  const carryPresetIds = searchParams.get("carryPresetIds")?.trim();
  const remixInit = useMemo(() => String(Date.now()), [template.id]);
  const remixQuery = new URLSearchParams({
    libraryId: template.id,
    remixInit,
  });
  if (carryPresetIds) {
    remixQuery.set("carryPresetIds", carryPresetIds);
  }
  const remixHref = `/images?${remixQuery.toString()}`;

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
        aria-label={`View ${title}`}
        title={title}
      >
        <Image
          src={template.imageUrl}
          alt=""
          width={stored ? template.width : 800}
          height={stored ? template.height : 1000}
          className="h-full w-full object-contain"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
          unoptimized
          priority={eager}
          loading={eager ? "eager" : undefined}
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
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2 pt-6 text-left opacity-0 transition-opacity duration-200",
            "group-hover:opacity-100",
          )}
          aria-hidden
        >
          <p className="truncate text-xs font-medium text-white">{title}</p>
        </div>
      </button>

      <BrandGuardedLink
        href={remixHref}
        description="Create a brand first to remix library templates."
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
      </BrandGuardedLink>
    </div>
  );
}
