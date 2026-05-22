"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { HelpCircleIcon } from "@hugeicons/core-free-icons";
import { useSupportModals } from "@/contexts/support-modals-context";

export function FloatingSupport() {
  const { openHelp } = useSupportModals();

  return (
    <button
      type="button"
      onClick={openHelp}
      className="fixed bottom-6 right-6 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      aria-label="Open help and FAQ"
    >
      <HugeiconsIcon
        icon={HelpCircleIcon}
        size={22}
        color="currentColor"
        strokeWidth={1.75}
      />
    </button>
  );
}
