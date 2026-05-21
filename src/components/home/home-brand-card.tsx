"use client";

import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  PaintBoardIcon,
} from "@hugeicons/core-free-icons";
import type { BrandKit } from "@/lib/brand/types";
import type { BrandSummary } from "@/lib/brand/brands";
import {
  brandColorPair,
  brandPaletteSwatches,
  brandTraitTags,
  pickBrandLogoUrl,
} from "@/lib/brand/brand-visual";
import { cn } from "@/lib/utils";

const MAX_SWATCHES = 4;
const MAX_TAGS = 3;

type HomeBrandCardProps = {
  summary: BrandSummary;
  kit?: BrandKit;
  onSelect?: () => void;
};

export function HomeBrandCard({ summary, kit, onSelect }: HomeBrandCardProps) {
  const logoUrl = pickBrandLogoUrl(kit);
  const { primary } = brandColorPair(kit);
  const swatches = brandPaletteSwatches(kit);
  const tags = brandTraitTags(kit);
  const visibleSwatches = swatches.slice(0, MAX_SWATCHES);
  const visibleTags = tags.slice(0, MAX_TAGS);
  const extraTags = tags.length - visibleTags.length;

  const heroLetter =
    summary.avatar.letter ?? summary.displayName.charAt(0).toUpperCase();

  return (
    <Link
      href={`/brands/${summary.id}`}
      onClick={onSelect}
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border border-border/80 bg-background p-3",
        "transition-shadow hover:shadow-md hover:ring-1 hover:ring-accent/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
      )}
    >
      <div className="relative aspect-[5/3] w-full overflow-hidden rounded-lg bg-white">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt=""
            fill
            className="object-contain object-center p-2"
            sizes="(max-width: 1280px) 280px, 320px"
            unoptimized
          />
        ) : (
          <div
            className="flex size-full items-center justify-center"
            style={{ backgroundColor: primary }}
          >
            <span
              className="font-display text-4xl tracking-tight text-white/90"
              aria-hidden
            >
              {heroLetter}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <HugeiconsIcon
              icon={PaintBoardIcon}
              size={14}
              color="currentColor"
              strokeWidth={1.75}
            />
            Brand
          </span>
          <h3 className="truncate font-display text-lg leading-tight tracking-tight text-foreground">
            {summary.displayName}
          </h3>
          <span className="mt-1 inline-flex items-center gap-0.5 text-xs text-muted">
            See details
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={14}
              color="currentColor"
              strokeWidth={1.75}
            />
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
          <div className="flex items-center gap-1">
            {visibleSwatches.map((color, i) => (
              <span
                key={`${color}-${i}`}
                className={cn(
                  "h-5 w-5 shrink-0 rounded-md ring-1 ring-border/50",
                  color.toLowerCase() === "#ffffff" ||
                    color.toLowerCase() === "#fff"
                    ? "bg-white"
                    : "",
                )}
                style={
                  color.toLowerCase() === "#ffffff" ||
                  color.toLowerCase() === "#fff"
                    ? undefined
                    : { backgroundColor: color }
                }
                aria-hidden
              />
            ))}
          </div>
          {visibleTags.length > 0 || extraTags > 0 ? (
            <div className="flex max-w-[9rem] flex-wrap justify-end gap-1">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-sidebar-active px-2 py-0.5 text-[10px] font-medium capitalize text-foreground"
                >
                  {tag}
                </span>
              ))}
              {extraTags > 0 ? (
                <span className="rounded-full bg-sidebar-active px-2 py-0.5 text-[10px] font-medium text-muted">
                  +{extraTags}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
