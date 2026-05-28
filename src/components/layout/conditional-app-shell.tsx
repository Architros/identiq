"use client";

import { Suspense } from "react";
import { AuthGate } from "@/components/auth/auth-gate";
import { BillingAccessProvider } from "@/contexts/billing-access-context";
import { BillingGateShell } from "@/components/layout/billing-gate-shell";
import { BrandPageLoader } from "@/components/ui/brand-page-loader";

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
      <Suspense
        fallback={<BrandPageLoader />}
      >
        <AuthGate>
          <BillingGateShell>{children}</BillingGateShell>
        </AuthGate>
      </Suspense>
    </BillingAccessProvider>
  );
}
