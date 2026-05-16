import type { AspectRatio } from "@/lib/generation/presets";
import { cn } from "@/lib/utils";

export const aspectRatioClass: Record<AspectRatio, string> = {
  "1:1": "aspect-square max-w-sm",
  "9:16": "aspect-[9/16] max-w-[220px]",
  "16:9": "aspect-video max-w-xl",
  "4:5": "aspect-[4/5] max-w-[280px]",
};

/** Aspect ratio box for brand generation panels (fills grid cell up to max width). */
export const aspectRatioPanelBoxClass: Record<AspectRatio, string> = {
  "1:1": "aspect-square w-full max-w-[min(100%,240px)]",
  "9:16": "aspect-[9/16] w-full max-w-[min(100%,168px)]",
  "16:9": "aspect-video w-full max-w-full",
  "4:5": "aspect-[4/5] w-full max-w-[min(100%,220px)]",
};

/** Larger tiles for live generation view (borderless). */
export const aspectRatioGenerationClass: Record<AspectRatio, string> = {
  "1:1": "aspect-square w-full max-w-[min(100%,320px)]",
  "9:16": "aspect-[9/16] w-full max-w-[min(100%,220px)]",
  "16:9": "aspect-video w-full max-w-full",
  "4:5": "aspect-[4/5] w-full max-w-[min(100%,280px)]",
};

/** Max width per ratio on the Images library (height follows aspect-ratio). */
export const aspectRatioGalleryMaxWidthClass: Record<AspectRatio, string> = {
  "1:1": "w-full max-w-[min(100%,320px)]",
  "9:16": "w-full max-w-[min(100%,240px)]",
  "16:9": "w-full max-w-full",
  "4:5": "w-full max-w-[min(100%,300px)]",
};

/** @deprecated Use aspectRatioPanelBoxClass */
export const aspectRatioPanelClass = aspectRatioPanelBoxClass;

/** @deprecated Use aspectRatioGalleryMaxWidthClass + aspectRatioCSSValue */
export const aspectRatioGalleryClass: Record<AspectRatio, string> = {
  "1:1": "aspect-square w-full",
  "9:16": "aspect-[9/16] w-full",
  "16:9": "aspect-video w-full",
  "4:5": "aspect-[4/5] w-full",
};

export function parseAspectRatio(value: string): AspectRatio {
  if (value in aspectRatioClass) {
    return value as AspectRatio;
  }
  return "16:9";
}

/** CSS `aspect-ratio` value (e.g. for inline style). */
export function aspectRatioCSSValue(ratio: AspectRatio): string {
  const map: Record<AspectRatio, string> = {
    "1:1": "1 / 1",
    "9:16": "9 / 16",
    "16:9": "16 / 9",
    "4:5": "4 / 5",
  };
  return map[ratio];
}

export function aspectRatioPanelWrapperClass(ratio: AspectRatio): string {
  return cn("relative mx-auto w-full", aspectRatioPanelBoxClass[ratio]);
}

export function aspectRatioGenerationWrapperClass(ratio: AspectRatio): string {
  return cn("relative mx-auto w-full", aspectRatioGenerationClass[ratio]);
}

/** Target display width for gallery thumbnails (height derived from ratio). */
export function galleryImageDimensions(ratio: AspectRatio): {
  width: number;
  height: number;
} {
  const widthByRatio: Record<AspectRatio, number> = {
    "1:1": 320,
    "9:16": 220,
    "16:9": 960,
    "4:5": 300,
  };
  const width = widthByRatio[ratio];
  const [w, h] = ratio.split(":").map(Number) as [number, number];
  return { width, height: Math.round((width * h) / w) };
}

/** Borderless media frame: true ratio, no crop (use with object-contain). */
export function aspectRatioGalleryFrameClass(ratio: AspectRatio): string {
  return cn(
    "relative overflow-hidden rounded-lg",
    aspectRatioGalleryMaxWidthClass[ratio],
  );
}

/** Grid layout tuned per dominant aspect ratio in a group. */
export function subgroupGridClass(
  items: { aspectRatio: string }[],
): string {
  const ratios = items.map((i) => parseAspectRatio(i.aspectRatio));
  if (ratios.some((r) => r === "16:9")) {
    return "grid grid-cols-1 gap-6";
  }
  if (ratios.some((r) => r === "9:16")) {
    return "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5";
  }
  return "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5";
}

/** Images library section grid — same rhythm as generation grouping. */
export function imagesLibraryGridClass(
  items: { aspectRatio: string }[],
): string {
  return cn(subgroupGridClass(items), "justify-items-start");
}
