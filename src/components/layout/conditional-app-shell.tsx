"use client";

import { Suspense } from "react";
import { BillingGateShell } from "@/components/layout/billing-gate-shell";

export function ConditionalAppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <BillingGateShell>{children}</BillingGateShell>
    </Suspense>
  );
}
