import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type AppBrandMarkProps = {
  className?: string;
  /** Logo only — for tight mobile headers. */
  compact?: boolean;
  onClick?: () => void;
};

export function AppBrandMark({
  className,
  compact = false,
  onClick,
}: AppBrandMarkProps) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn(
        "flex min-w-0 items-center gap-2.5 rounded-lg transition-opacity hover:opacity-90",
        className,
      )}
    >
      <Image
        src="/brand/logo-identiq.svg"
        alt=""
        width={36}
        height={26}
        className="h-8 w-auto shrink-0 sm:h-9"
        priority
        style={{ width: "auto", height: "auto" }}
      />
      {!compact ? (
        <span className="truncate font-display text-xl tracking-tight text-foreground sm:text-2xl">
          identiq
        </span>
      ) : null}
    </Link>
  );
}
