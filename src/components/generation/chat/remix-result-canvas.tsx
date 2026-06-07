"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { ImageResultData } from "@/lib/generation/chat-message-types";
import { ImageSkeletonGrid } from "@/components/generation/chat/image-skeleton-grid";
import {
  aspectRatioCSSValue,
  aspectRatioGenerationCenteredTileClass,
  parseAspectRatio,
} from "@/lib/generation/aspect-ratio-styles";
import { formatInlineGenerationError } from "@/lib/generation/format-inline-generation-error";
import { generationProgressTexts } from "@/lib/generation/generation-progress-texts";
import { cn } from "@/lib/utils";

type RemixResultCanvasProps = {
  imageResult: ImageResultData | null;
  aspectRatio: string;
  quantity: number;
  remixPreviewUrl?: string;
  presetTitle?: string;
  isGenerating: boolean;
  isFailed: boolean;
  errorMessage?: string | null;
  elapsedStartedAt?: number | null;
  onRetry?: () => void;
};

export function RemixResultCanvas({
  imageResult,
  aspectRatio,
  quantity,
  remixPreviewUrl,
  presetTitle,
  isGenerating,
  isFailed,
  errorMessage,
  elapsedStartedAt,
  onRetry,
}: RemixResultCanvasProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const ratio = parseAspectRatio(aspectRatio);
  const first = imageResult?.images[0];
  const previewUrl =
    first?.url ??
    (first?.base64 ? `data:${first.mediaType};base64,${first.base64}` : null);

  useEffect(() => {
    setImageLoaded(false);
  }, [previewUrl]);

  const progressTexts = useMemo(
    () =>
      generationProgressTexts({
        phase: isFailed ? "error" : "generating-image",
        presetTitle,
        isLibraryRemix: true,
      }),
    [isFailed, presetTitle],
  );

  if (!previewUrl && (isGenerating || isFailed)) {
    return (
      <div className="w-full">
        {isFailed ? (
          <p className="mb-3 text-sm text-muted">
            {formatInlineGenerationError(errorMessage)}
          </p>
        ) : null}
        <ImageSkeletonGrid
          aspectRatio={aspectRatio}
          quantity={quantity}
          mediaTypeLabel={presetTitle}
          remixPreviewUrl={remixPreviewUrl}
          elapsedStartedAt={elapsedStartedAt}
          progressTexts={progressTexts}
          animated={!isFailed}
          failed={isFailed}
          centered
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (!previewUrl) return null;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div
        className={cn(
          aspectRatioGenerationCenteredTileClass(ratio),
          "relative w-[min(100%,420px)] max-w-[420px] overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-sm",
        )}
        style={{ aspectRatio: aspectRatioCSSValue(ratio) }}
      >
        {!imageLoaded ? (
          <div className="absolute inset-0 z-10 animate-pulse bg-gradient-to-br from-sidebar-active via-border/30 to-sidebar-active" />
        ) : null}
        <Image
          src={previewUrl}
          alt="Remixed brand asset"
          fill
          className={cn(
            "object-contain transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0",
          )}
          unoptimized
          priority
          onLoad={() => setImageLoaded(true)}
        />
      </div>
      {imageResult?.displayDimensions || presetTitle ? (
        <p className="text-center text-xs text-muted">
          {[imageResult?.displayDimensions, presetTitle].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
