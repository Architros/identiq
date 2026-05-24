"use client";

import { Suspense } from "react";
import { AuthGate } from "@/components/auth/auth-gate";
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
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-background">
            <p className="text-sm text-muted">Loading…</p>
          </div>
        }
      >
        <AuthGate>
          <BillingGateShell>{children}</BillingGateShell>
        </AuthGate>
      </Suspense>
    </BillingAccessProvider>
  );
}
