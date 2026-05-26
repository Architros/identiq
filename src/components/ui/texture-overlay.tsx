import { cn } from "@/lib/utils";

export type TextureType =
  | "dots"
  | "grid"
  | "noise"
  | "crosshatch"
  | "diagonal"
  | "scatteredDots"
  | "halftone"
  | "triangular"
  | "chevron"
  | "paperGrain"
  | "horizontalLines"
  | "verticalLines"
  | "none";

type TextureOverlayProps = {
  texture: TextureType;
  opacity?: number;
  className?: string;
};

const DEFAULT_OPACITIES: Partial<Record<TextureType, number>> = {
  dots: 0.35,
  grid: 0.3,
  noise: 0.4,
  crosshatch: 0.28,
  diagonal: 0.22,
  scatteredDots: 0.35,
  halftone: 0.3,
  triangular: 0.25,
  chevron: 0.28,
  paperGrain: 0.35,
  horizontalLines: 0.25,
  verticalLines: 0.25,
};

const TEXTURE_STYLES: Record<
  Exclude<TextureType, "none">,
  { backgroundImage: string; backgroundSize?: string }
> = {
  dots: {
    backgroundImage:
      "radial-gradient(circle, currentColor 1px, transparent 1px)",
    backgroundSize: "10px 10px",
  },
  grid: {
    backgroundImage: `
      linear-gradient(currentColor 1px, transparent 1px),
      linear-gradient(90deg, currentColor 1px, transparent 1px)
    `,
    backgroundSize: "16px 16px",
  },
  noise: {
    backgroundImage: `
      radial-gradient(circle at 20% 30%, currentColor 0.5px, transparent 0.5px),
      radial-gradient(circle at 70% 60%, currentColor 0.5px, transparent 0.5px),
      radial-gradient(circle at 40% 80%, currentColor 0.5px, transparent 0.5px),
      radial-gradient(circle at 85% 15%, currentColor 0.5px, transparent 0.5px)
    `,
    backgroundSize: "4px 4px",
  },
  crosshatch: {
    backgroundImage: `
      repeating-linear-gradient(
        45deg,
        currentColor 0,
        currentColor 1px,
        transparent 1px,
        transparent 10px
      ),
      repeating-linear-gradient(
        -45deg,
        currentColor 0,
        currentColor 1px,
        transparent 1px,
        transparent 10px
      )
    `,
  },
  diagonal: {
    backgroundImage: `
      repeating-linear-gradient(
        -45deg,
        currentColor 0,
        currentColor 1px,
        transparent 1px,
        transparent 14px
      )
    `,
  },
  scatteredDots: {
    backgroundImage: `
      radial-gradient(circle at 12% 22%, currentColor 1px, transparent 1px),
      radial-gradient(circle at 68% 18%, currentColor 1px, transparent 1px),
      radial-gradient(circle at 44% 72%, currentColor 1px, transparent 1px),
      radial-gradient(circle at 88% 64%, currentColor 1px, transparent 1px),
      radial-gradient(circle at 28% 88%, currentColor 1px, transparent 1px)
    `,
    backgroundSize: "24px 24px",
  },
  halftone: {
    backgroundImage:
      "radial-gradient(circle, currentColor 1.5px, transparent 1.5px)",
    backgroundSize: "8px 8px",
  },
  triangular: {
    backgroundImage: `
      linear-gradient(30deg, currentColor 12%, transparent 12%),
      linear-gradient(150deg, currentColor 12%, transparent 12%),
      linear-gradient(270deg, currentColor 12%, transparent 12%)
    `,
    backgroundSize: "18px 18px",
  },
  chevron: {
    backgroundImage: `
      repeating-linear-gradient(
        135deg,
        currentColor 0,
        currentColor 2px,
        transparent 2px,
        transparent 12px
      )
    `,
  },
  paperGrain: {
    backgroundImage: `
      repeating-linear-gradient(
        0deg,
        currentColor 0,
        transparent 1px,
        transparent 3px
      ),
      repeating-linear-gradient(
        90deg,
        currentColor 0,
        transparent 1px,
        transparent 4px
      )
    `,
  },
  horizontalLines: {
    backgroundImage:
      "repeating-linear-gradient(0deg, currentColor 0, currentColor 1px, transparent 1px, transparent 10px)",
  },
  verticalLines: {
    backgroundImage:
      "repeating-linear-gradient(90deg, currentColor 0, currentColor 1px, transparent 1px, transparent 10px)",
  },
};

/** Decorative texture via CSS gradients (absolute, non-interactive). */
export function TextureOverlay({
  texture,
  opacity,
  className,
}: TextureOverlayProps) {
  if (texture === "none") return null;

  const style = TEXTURE_STYLES[texture];
  const resolvedOpacity = opacity ?? DEFAULT_OPACITIES[texture] ?? 0.3;

  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        opacity: resolvedOpacity,
        backgroundImage: style.backgroundImage,
        backgroundSize: style.backgroundSize,
      }}
    />
  );
}
