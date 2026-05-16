"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import type {
  AssetCompleteData,
  AssetProgressData,
} from "@/lib/brand/create-stream-types";
import { AssetAspectSkeleton } from "@/components/brand-create/generation/asset-aspect-skeleton";
import {
  aspectRatioGenerationWrapperClass,
  parseAspectRatio,
} from "@/lib/generation/aspect-ratio-styles";
import { generatedImagePreviewUrl } from "@/lib/storage/upload-client";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<AssetProgressData["status"], string> = {
  queued: "Queued",
  generating: "Generating",
  uploading: "Saving",
  saved: "Saved",
  error: "Failed",
};

const STATUS_STYLE: Record<AssetProgressData["status"], string> = {
  queued: "bg-foreground/70 text-white",
  generating: "bg-accent text-white",
  uploading: "bg-accent text-white",
  saved: "bg-emerald-600 text-white",
  error: "bg-red-600 text-white",
};

function skeletonLabel(status: AssetProgressData["status"]): string {
  if (status === "queued") return "Queued";
  if (status === "generating") return "Generating…";
  if (status === "uploading") return "Saving…";
  return "";
}

type GenerationTileProps = {
  progress: AssetProgressData;
  result?: AssetCompleteData;
};

export function GenerationTile({ progress, result }: GenerationTileProps) {
  const ratio = parseAspectRatio(progress.aspectRatio);
  const previewUrl = result ? generatedImagePreviewUrl(result) : undefined;
  const [imageError, setImageError] = useState(false);
  const isActive =
    progress.status === "generating" || progress.status === "uploading";
  const showSkeleton =
    !previewUrl && progress.status !== "error" && progress.status !== "saved";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative w-full min-w-0"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-2">
        <div className="min-w-0 rounded-lg bg-foreground/55 px-2 py-1 backdrop-blur-sm">
          <p className="truncate text-xs font-medium text-white">
            {progress.title}
          </p>
          {progress.variantLabel ? (
            <p className="truncate text-[10px] text-white/80">
              {progress.variantLabel}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm",
            STATUS_STYLE[progress.status],
            isActive && "animate-pulse",
          )}
        >
          {STATUS_LABEL[progress.status]}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {previewUrl && !imageError ? (
          <motion.div
            key="image"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className={cn(
              aspectRatioGenerationWrapperClass(ratio),
              "overflow-hidden rounded-lg",
            )}
          >
            <Image
              src={previewUrl}
              alt={progress.title}
              fill
              className="object-contain"
              unoptimized
              onError={() => setImageError(true)}
            />
          </motion.div>
        ) : showSkeleton ? (
          <AssetAspectSkeleton
            key="skeleton"
            aspectRatio={progress.aspectRatio}
            active={isActive}
            label={skeletonLabel(progress.status)}
            size="generation"
          />
        ) : (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              aspectRatioGenerationWrapperClass(ratio),
              "flex flex-col items-center justify-center gap-1 overflow-hidden rounded-xl bg-red-50",
            )}
          >
            <span className="text-xs font-medium text-red-600">
              {imageError ? "Preview failed to load" : "Failed"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {progress.status === "error" && progress.errorMessage ? (
        <p className="mt-2 text-xs text-red-600">{progress.errorMessage}</p>
      ) : null}
    </motion.div>
  );
}

/** @deprecated Use GenerationTile */
export const AssetGenerationPanel = GenerationTile;

