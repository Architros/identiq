import { cn } from "@/lib/utils";

/**
 * Flat accent classes for legacy / non-texture controls (e.g. filter chips).
 * Prefer `TextureButton` for primary CTAs.
 */
export const ctaPrimaryClasses = "bg-accent text-on-accent hover:bg-accent/90";

export const ctaPrimaryFocusClasses =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2";

export function ctaPrimary(
  ...extra: (string | false | null | undefined)[]
) {
  return cn(ctaPrimaryClasses, ctaPrimaryFocusClasses, ...extra);
}
