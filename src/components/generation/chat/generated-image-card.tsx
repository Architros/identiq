"use client";

import { useState } from "react";
import Image from "next/image";
import { useBrandAssets } from "@/contexts/brand-assets-context";
import { useGeneration } from "@/contexts/generation-context";
import {
  ImageLightboxModal,
  type LightboxImage,
} from "@/components/images/image-lightbox-modal";
import type { ImageResultData } from "@/lib/generation/chat-message-types";
import { formatRelativeTime } from "@/lib/generation/format-elapsed";
import {
  aspectRatioCSSValue,
  aspectRatioGenerationLeftWrapperClass,
  parseAspectRatio,
} from "@/lib/generation/aspect-ratio-styles";
import { getLibraryTemplate } from "@/lib/library/templates";
import { cn } from "@/lib/utils";

type GeneratedImageCardProps = {
  data: ImageResultData;
};

function remixTemplatePreviewUrl(
  libraryTemplateId: string | null,
  referenceImages: Array<{ previewUrl: string; name?: string }>,
): string | undefined {
  const fromRefs =
    referenceImages.find((img) => img.name === "Template")?.previewUrl ??
    referenceImages[0]?.previewUrl;
  if (fromRefs) return fromRefs;
  if (!libraryTemplateId) return undefined;
  return getLibraryTemplate(libraryTemplateId)?.imageUrl;
}

export function GeneratedImageCard({ data }: GeneratedImageCardProps) {
  const { discardAsset } = useBrandAssets();
  const { closeChat, libraryTemplateId, referenceImages } = useGeneration();
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
  const remixTemplateUrl = remixTemplatePreviewUrl(
    libraryTemplateId,
    referenceImages,
  );
  const isLibraryRemix = Boolean(remixTemplateUrl);
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

  const generatedImage = (
    <button
      type="button"
      onClick={() =>
        setLightbox({
          src: previewUrl,
          alt: "Generated brand asset",
          title: `Job ${data.jobId}`,
          subtitle: lightboxSubtitle || undefined,
          downloadFilename: `${data.jobId}.png`,
          libraryHref: "/images",
          libraryLabel: "Brand assets",
          onLibraryNavigate: closeChat,
        })
      }
      className={cn(
        aspectRatioGenerationLeftWrapperClass(ratio),
        "cursor-pointer overflow-hidden rounded-xl transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        isLibraryRemix && "min-w-0 flex-1",
      )}
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
  );

  return (
    <div className="space-y-3">
      {remixTemplateUrl ? (
        <div className="flex items-start gap-3">
          {generatedImage}
          <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
            <div
              className="relative w-[88px] overflow-hidden rounded-lg border border-border/70 bg-surface shadow-sm"
              style={{ aspectRatio: aspectRatioCSSValue(ratio) }}
            >
              <Image
                src={remixTemplateUrl}
                alt="Remix template"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <span className="max-w-[88px] text-center text-[10px] font-medium leading-tight text-muted">
              Remix source
            </span>
          </div>
        </div>
      ) : (
        generatedImage
      )}
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

