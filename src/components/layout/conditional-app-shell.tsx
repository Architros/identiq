"use client";

import { Suspense } from "react";
import { BillingAccessProvider } from "@/contexts/billing-access-context";
import { BillingGateShell } from "@/components/layout/billing-gate-shell";

type ConditionalAppShellProps = {
  children: React.ReactNode;
  initialHasBillingAccess?: boolean | null;
};

export function ConditionalAppShell({
  children,
  initialHasBillingAccess = null,
}: ConditionalAppShellProps) {
  return (
    <BillingAccessProvider initialHasBillingAccess={initialHasBillingAccess}>
      <Suspense fallback={null}>
        <BillingGateShell>{children}</BillingGateShell>
      </Suspense>
    </BillingAccessProvider>
  );
}
