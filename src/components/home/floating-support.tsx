"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Message01Icon } from "@hugeicons/core-free-icons";

export function FloatingSupport() {
  return (
    <button
      type="button"
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      aria-label="Open support chat"
    >
      <HugeiconsIcon
        icon={Message01Icon}
        size={22}
        color="currentColor"
        strokeWidth={1.75}
      />
    </button>
  );
}
