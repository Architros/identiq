"use client";

import Link from "next/link";
import { TextureOverlay } from "@/components/ui/texture-overlay";
import { ctaPrimaryFocusClasses } from "@/components/ui/cta-styles";
import { cn } from "@/lib/utils";

type TextureButtonVariant = "accent" | "primary";
type TextureButtonShape = "pill" | "default" | "lg" | "card";

type TextureButtonProps = {
  href?: string;
  children: React.ReactNode;
  variant?: TextureButtonVariant;
  shape?: TextureButtonShape;
  fullWidth?: boolean;
  /** Layout on the gradient shell only (margins, z-index). Not padding. */
  className?: string;
  /** Size, padding, typography on the clickable surface. */
  innerClassName?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const shapeRadius: Record<TextureButtonShape, string> = {
  pill: "rounded-full",
  default: "rounded-[var(--radius-button)]",
  lg: "rounded-lg",
  card: "rounded-xl",
};

const outerVariant: Record<TextureButtonVariant, string> = {
  accent:
    "border border-black/10 bg-gradient-to-b from-[#ff9a5c] to-[#e06420] p-px shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_4px_14px_rgba(248,110,41,0.35)]",
  primary:
    "border border-black/15 bg-gradient-to-b from-neutral-600 to-neutral-900 p-px shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_4px_12px_rgba(0,0,0,0.2)]",
};

const innerVariant: Record<TextureButtonVariant, string> = {
  accent:
    "relative inline-flex cursor-pointer items-center justify-center overflow-hidden bg-gradient-to-b from-[#f97a32] to-[#e8641c] text-on-accent transition-all duration-200 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_10px_20px_rgba(248,110,41,0.25)] active:translate-y-0 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50",
  primary:
    "relative inline-flex cursor-pointer items-center justify-center overflow-hidden bg-gradient-to-b from-neutral-700 to-neutral-900 text-white transition-all duration-200 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_8px_16px_rgba(0,0,0,0.3)] active:translate-y-0 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50",
};

const defaultInnerSize = "px-6 py-2.5 text-sm font-semibold";

function ButtonInner({
  variant,
  children,
}: {
  variant: TextureButtonVariant;
  children: React.ReactNode;
}) {
  return (
    <>
      <TextureOverlay
        texture="diagonal"
        diagonalStep={4}
        fadeToTop
        opacity={variant === "accent" ? 0.4 : 0.25}
        className={variant === "accent" ? "text-white/50" : "text-white/25"}
      />
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </>
  );
}

/** Neumorphic button with diagonal texture overlay (Cult TextureButton-style). */
export function TextureButton({
  href,
  children,
  variant = "accent",
  shape = "pill",
  fullWidth = false,
  className,
  innerClassName,
  type = "button",
  disabled,
  onClick,
}: TextureButtonProps) {
  const radius = shapeRadius[shape];
  const shell = cn(
    "inline-flex transition duration-300 ease-out",
    radius,
    outerVariant[variant],
    fullWidth && "flex w-full",
    className,
  );
  const inner = cn(
    radius,
    innerVariant[variant],
    ctaPrimaryFocusClasses,
    fullWidth && "w-full",
    innerClassName ?? defaultInnerSize,
  );

  if (href) {
    return (
      <span className={shell}>
        <Link href={href} className={inner}>
          <ButtonInner variant={variant}>{children}</ButtonInner>
        </Link>
      </span>
    );
  }

  return (
    <span className={shell}>
      <button type={type} disabled={disabled} onClick={onClick} className={inner}>
        <ButtonInner variant={variant}>{children}</ButtonInner>
      </button>
    </span>
  );
}
