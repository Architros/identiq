import type { AspectRatio } from "@/lib/generation/presets";
import { cn } from "@/lib/utils";

export const aspectRatioClass: Record<AspectRatio, string> = {
  "1:1": "aspect-square max-w-sm",
  "9:16": "aspect-[9/16] max-w-[220px]",
  "16:9": "aspect-video max-w-xl",
  "4:5": "aspect-[4/5] max-w-[280px]",
  "2:3": "aspect-[2/3] max-w-[240px]",
  "21:9": "aspect-[21/9] max-w-full",
};

/** Aspect ratio box for brand generation panels (fills grid cell up to max width). */
export const aspectRatioPanelBoxClass: Record<AspectRatio, string> = {
  "1:1": "aspect-square w-full max-w-[min(100%,240px)]",
  "9:16": "aspect-[9/16] w-full max-w-[min(100%,168px)]",
  "16:9": "aspect-video w-full max-w-full",
  "4:5": "aspect-[4/5] w-full max-w-[min(100%,220px)]",
  "2:3": "aspect-[2/3] w-full max-w-[min(100%,200px)]",
  "21:9": "aspect-[21/9] w-full max-w-full",
};

/** Larger tiles for live generation view (borderless). */
export const aspectRatioGenerationClass: Record<AspectRatio, string> = {
  "1:1": "aspect-square w-full max-w-[min(100%,320px)]",
  "9:16": "aspect-[9/16] w-full max-w-[min(100%,220px)]",
  "16:9": "aspect-video w-full max-w-full",
  "4:5": "aspect-[4/5] w-full max-w-[min(100%,280px)]",
  "2:3": "aspect-[2/3] w-full max-w-[min(100%,260px)]",
  "21:9": "aspect-[21/9] w-full max-w-full",
};

/** Max width per ratio on the Images library (height follows aspect-ratio). */
export const aspectRatioGalleryMaxWidthClass: Record<AspectRatio, string> = {
  "1:1": "w-full max-w-[min(100%,320px)]",
  "9:16": "w-full max-w-[min(100%,240px)]",
  "16:9": "w-full max-w-full",
  "4:5": "w-full max-w-[min(100%,300px)]",
  "2:3": "w-full max-w-[min(100%,280px)]",
  "21:9": "w-full max-w-full",
};

/** Library card tiles — larger than first compact pass, capped per ratio. */
export const aspectRatioGalleryCardMaxWidthClass: Record<AspectRatio, string> = {
  "1:1": "w-full max-w-[min(100%,260px)]",
  "9:16": "w-full max-w-[min(100%,220px)]",
  "16:9": "w-full max-w-full",
  "4:5": "w-full max-w-[min(100%,240px)]",
  "2:3": "w-full max-w-[min(100%,230px)]",
  "21:9": "w-full max-w-full",
};

/** @deprecated Use aspectRatioPanelBoxClass */
export const aspectRatioPanelClass = aspectRatioPanelBoxClass;

/** @deprecated Use aspectRatioGalleryMaxWidthClass + aspectRatioCSSValue */
export const aspectRatioGalleryClass: Record<AspectRatio, string> = {
  "1:1": "aspect-square w-full",
  "9:16": "aspect-[9/16] w-full",
  "16:9": "aspect-video w-full",
  "4:5": "aspect-[4/5] w-full",
  "2:3": "aspect-[2/3] w-full",
  "21:9": "aspect-[21/9] w-full",
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
    "2:3": "2 / 3",
    "21:9": "21 / 9",
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
    "2:3": 280,
    "21:9": 960,
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

/** Compact library card frame (smaller max widths). */
export function aspectRatioGalleryCardFrameClass(ratio: AspectRatio): string {
  return cn(
    "relative w-full overflow-hidden rounded-lg",
    aspectRatioGalleryCardMaxWidthClass[ratio],
  );
}

/** Responsive library grid — cards grow with column width up to ratio max. */
export function imagesLibraryCardGridClass(): string {
  return "grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 sm:gap-5 justify-items-stretch";
}

/** Grid layout tuned per dominant aspect ratio in a group. */
export function subgroupGridClass(
  items: { aspectRatio: string }[],
): string {
  const ratios = items.map((i) => parseAspectRatio(i.aspectRatio));
  if (ratios.some((r) => r === "16:9" || r === "21:9")) {
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
