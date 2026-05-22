"use client";

import { useCallback, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download04Icon,
  Edit02Icon,
} from "@hugeicons/core-free-icons";
import { LazyAssetThumbnail } from "@/components/images/lazy-asset-thumbnail";
import { Badge } from "@/components/ui/badge";
import { downloadImageUrl } from "@/lib/download/fetch-image-blob";
import type { AspectRatio } from "@/lib/generation/presets";
import { cn } from "@/lib/utils";

export type BrandAssetCardAction = {
  onOpen?: () => void;
  onDownload?: () => void;
  onAttachToChat?: () => void;
  isAttachedToChat?: boolean;
};

export type BrandAssetCardProps = {
  src: string;
  alt: string;
  ratio: AspectRatio;
  usageLabel: string;
  metaLine: string;
  priority?: boolean;
  actions?: BrandAssetCardAction;
  compact?: boolean;
};

export function BrandAssetCard({
  src,
  alt,
  ratio,
  usageLabel,
  metaLine,
  priority = false,
  actions,
  compact = true,
}: BrandAssetCardProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (actions?.onDownload) {
        actions.onDownload();
        return;
      }
      setDownloading(true);
      try {
        const safeName = alt.replace(/[^\w.-]+/g, "_").slice(0, 80) || "asset";
        await downloadImageUrl(src, `${safeName}.png`);
      } catch {
        window.open(src, "_blank", "noopener,noreferrer");
      } finally {
        setDownloading(false);
      }
    },
    [actions, alt, src],
  );

  const handleAttach = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    actions?.onAttachToChat?.();
  };

  const actionBtn =
    "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 text-foreground shadow-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <article className="group flex w-full min-w-0 flex-col gap-2.5">
      <div className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-surface shadow-sm">
        <LazyAssetThumbnail
          src={src}
          alt={alt}
          ratio={ratio}
          priority={priority}
          size={compact ? "card" : "gallery"}
          fit={compact ? "cover" : "contain"}
          className="w-full rounded-none border-0 transition group-hover:opacity-95"
        />

        {actions?.onOpen ? (
          <button
            type="button"
            onClick={actions.onOpen}
            className={cn(
              "absolute inset-0 z-10 cursor-pointer rounded-xl",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            )}
            aria-label={`View ${alt}`}
          />
        ) : null}

        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-11 rounded-xl bg-black/0 transition-colors duration-200",
            "group-hover:bg-black/15",
            actions?.onOpen && "group-focus-within:bg-black/15",
          )}
          aria-hidden
        />

        {actions?.onOpen ? (
          <span
            className={cn(
              "pointer-events-none absolute inset-x-0 top-1/2 z-12 -translate-y-1/2 text-center text-xs font-medium text-white opacity-0 drop-shadow-md transition-opacity duration-200",
              "group-hover:opacity-100 group-focus-within:opacity-100",
            )}
            aria-hidden
          >
            View
          </span>
        ) : null}

        {actions?.onAttachToChat ? (
          <button
            type="button"
            title={
              actions.isAttachedToChat
                ? "Attached to prompt"
                : "Attach to prompt"
            }
            onClick={handleAttach}
            className={cn(
              actionBtn,
              "absolute bottom-2.5 left-2.5 z-20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
              actions.isAttachedToChat && "opacity-100 ring-2 ring-accent",
            )}
          >
            <HugeiconsIcon
              icon={Edit02Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.75}
            />
          </button>
        ) : null}

        <button
          type="button"
          title={downloading ? "Downloading…" : "Download"}
          disabled={downloading}
          onClick={handleDownload}
          className={cn(
            actionBtn,
            "absolute bottom-2.5 right-2.5 z-20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
            "disabled:cursor-wait disabled:opacity-60",
          )}
        >
          <HugeiconsIcon
            icon={Download04Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.75}
          />
        </button>
      </div>

      <div className="min-w-0 space-y-1 px-0.5">
        <Badge>{usageLabel}</Badge>
        <p className="truncate text-xs text-muted">{metaLine}</p>
      </div>
    </article>
  );
}
