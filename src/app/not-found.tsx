import Link from "next/link";
import { cn } from "@/lib/utils";

const linkButtonClass =
  "inline-flex h-9 items-center justify-center rounded-[var(--radius-button)] px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-muted">
        404
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight text-foreground">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        This page doesn&apos;t exist or was moved. Head back home or sign in to
        continue.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className={cn(
            linkButtonClass,
            "bg-foreground text-surface hover:bg-foreground/90",
          )}
        >
          Go home
        </Link>
        <Link
          href="/login"
          className={cn(
            linkButtonClass,
            "text-foreground hover:bg-sidebar-active",
          )}
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
