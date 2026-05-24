"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function BillingCancelledNotice() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("billing") === "cancelled") {
      setVisible(true);
      const path = window.location.pathname;
      router.replace(path, { scroll: false });
    }
  }, [searchParams, router]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 border-b border-border bg-surface px-4 py-2.5 text-sm text-muted",
      )}
      role="status"
    >
      <span>Checkout was cancelled. No charges were made.</span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="rounded px-1.5 py-0.5 text-foreground hover:bg-sidebar-active"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
