"use client";

import { useState } from "react";
import Image from "next/image";
import { useBrandAssets } from "@/contexts/brand-assets-context";
import {
  ImageLightboxModal,
  type LightboxImage,
} from "@/components/images/image-lightbox-modal";
import type { ImageResultData } from "@/lib/generation/chat-message-types";
import { formatRelativeTime } from "@/lib/generation/format-elapsed";
import {
  aspectRatioGenerationLeftWrapperClass,
  parseAspectRatio,
} from "@/lib/generation/aspect-ratio-styles";

type GeneratedImageCardProps = {
  data: ImageResultData;
};

export function GeneratedImageCard({ data }: GeneratedImageCardProps) {
  const { discardAsset } = useBrandAssets();
  const [hidden, setHidden] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxImage | null>(null);
  const first = data.images[0];
  if (!first || hidden) return null;

  const previewUrl =
    first.url ??
    (first.base64
      ? `data:${first.mediaType};base64,${first.base64}`
      : "");
  if (!previewUrl) return null;
  const ratio = parseAspectRatio(data.aspectRatio);
  const completedLabel = data.completedAt
    ? formatRelativeTime(data.completedAt)
    : null;

  const lightboxSubtitle = [
    data.displayDimensions,
    completedLabel,
    data.presetTitles.length > 0 ? data.presetTitles.join(", ") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() =>
          setLightbox({
            src: previewUrl,
            alt: "Generated brand asset",
            title: `Job ${data.jobId}`,
            subtitle: lightboxSubtitle || undefined,
          })
        }
        className={`${aspectRatioGenerationLeftWrapperClass(ratio)} cursor-pointer overflow-hidden rounded-xl transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40`}
        aria-label="Open generated image preview"
      >
        <Image
          src={previewUrl}
          alt="Generated brand asset"
          fill
          className="object-contain"
          unoptimized
        />
      </button>
      <ImageLightboxModal
        image={lightbox}
        onClose={() => setLightbox(null)}
      />
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>Job {data.jobId}</span>
        {data.displayDimensions ? (
          <>
            <span>·</span>
            <span>{data.displayDimensions}</span>
          </>
        ) : null}
        {completedLabel ? (
          <>
            <span>·</span>
            <span>{completedLabel}</span>
          </>
        ) : null}
        {data.presetTitles.length > 0 ? (
          <>
            <span>·</span>
            <span>{data.presetTitles.join(", ")}</span>
          </>
        ) : null}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            const ok = window.confirm(
              "Discard this generated image from Brand assets?",
            );
            if (!ok) return;
            discardAsset(data.jobId);
            setHidden(true);
          }}
          className="cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-sidebar-active hover:text-foreground"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
