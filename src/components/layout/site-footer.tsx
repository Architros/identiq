import Link from "next/link";
import { cn } from "@/lib/utils";

const COPYRIGHT_YEAR = new Date().getFullYear();

type SiteFooterProps = {
  className?: string;
};

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        "shrink-0 border-t border-border bg-surface px-4 py-2.5 text-center text-xs text-muted sm:px-6",
        className,
      )}
    >
      <p className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1">
        <span>© {COPYRIGHT_YEAR} Identiq</span>
        <span className="text-border" aria-hidden>
          ·
        </span>
        <Link
          href="/privacy"
          className="underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          Privacy Policy
        </Link>
        <span className="text-border" aria-hidden>
          ·
        </span>
        <Link
          href="/terms"
          className="underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          Terms &amp; Conditions
        </Link>
      </p>
    </footer>
  );
}
