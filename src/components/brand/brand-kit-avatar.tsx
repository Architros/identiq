"use client";

import Image from "next/image";
import type { BrandKit } from "@/lib/brand/types";
import type { BrandSummary } from "@/lib/brand/brands";
import { brandColorPair, pickBrandLogoUrl } from "@/lib/brand/brand-visual";
import { cn } from "@/lib/utils";

type BrandKitAvatarProps = {
  summary: BrandSummary;
  kit?: BrandKit;
  size?: "sm" | "md" | "lg";
  showColorDots?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
};

export function BrandKitAvatar({
  summary,
  kit,
  size = "md",
  showColorDots = true,
  className,
}: BrandKitAvatarProps) {
  const logoUrl = pickBrandLogoUrl(kit);
  const { primary, secondary } = brandColorPair(kit);
  const fallbackBg = summary.avatar.bg;
  const fallbackColor = summary.avatar.color;

  return (
    <div className={cn("flex flex-col items-center gap-1.5", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-full ring-2 ring-white/80",
          sizeClasses[size],
        )}
        style={{
          backgroundColor: logoUrl ? "#ffffff" : fallbackBg,
        }}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt=""
            fill
            className="object-contain p-1.5"
            unoptimized
          />
        ) : summary.avatar.icon === "triangle" ? (
          <span
            className="flex h-full w-full items-center justify-center"
            style={{ color: fallbackColor }}
          >
            <svg
              width="14"
              height="12"
              viewBox="0 0 12 10"
              fill="currentColor"
              aria-hidden
            >
              <path d="M6 0L12 10H0L6 0Z" />
            </svg>
          </span>
        ) : (
          <span
            className="flex h-full w-full items-center justify-center text-sm font-semibold"
            style={{ color: fallbackColor }}
          >
            {summary.avatar.letter ?? summary.displayName.charAt(0)}
          </span>
        )}
      </div>
      {showColorDots ? (
        <span className="flex gap-1" aria-hidden>
          <span
            className="h-2 w-2 rounded-full ring-1 ring-border/40"
            style={{ backgroundColor: primary }}
          />
          <span
            className="h-2 w-2 rounded-full ring-1 ring-border/40"
            style={{ backgroundColor: secondary }}
          />
        </span>
      ) : null}
    </div>
  );
}
