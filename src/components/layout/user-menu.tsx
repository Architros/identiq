import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { mockUser } from "@/lib/mock-data";

export function UserMenu() {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      aria-label="User menu"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-sm font-semibold text-foreground">
        {mockUser.initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {mockUser.name}
        </span>
        <span className="block truncate text-xs text-muted">
          {mockUser.email}
        </span>
      </span>
      <HugeiconsIcon
        icon={ArrowDown01Icon}
        size={16}
        color="currentColor"
        strokeWidth={1.75}
      />
    </button>
  );
}
