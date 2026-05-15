import { cn } from "@/lib/utils";
import type { BrandAvatarStyle } from "@/lib/brand/brands";

type BrandAvatarProps = {
  avatar: BrandAvatarStyle;
  size?: "sm" | "md";
};

export function BrandAvatar({ avatar, size = "md" }: BrandAvatarProps) {
  const sizeClass = size === "sm" ? "h-8 w-8 text-sm" : "h-9 w-9 text-sm";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        sizeClass,
      )}
      style={{ backgroundColor: avatar.bg, color: avatar.color }}
    >
      {avatar.icon === "triangle" ? (
        <svg
          width="12"
          height="10"
          viewBox="0 0 12 10"
          fill="currentColor"
          aria-hidden
        >
          <path d="M6 0L12 10H0L6 0Z" />
        </svg>
      ) : (
        avatar.letter
      )}
    </span>
  );
}
