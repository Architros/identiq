"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BillingOnboardingShell } from "@/components/billing/billing-onboarding-shell";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useBillingAccess } from "@/contexts/billing-access-context";
import { readCachedBillingAccess } from "@/lib/auth/client-storage";
import { isPublicAppPath } from "@/lib/auth/protected-paths";

function isBillingPath(pathname: string): boolean {
  return pathname === "/billing" || pathname.startsWith("/billing/");
}

function isBillingFulfillPath(pathname: string): boolean {
  return pathname.startsWith("/billing/complete");
}

/**
 * UI shell only — route protection is handled by middleware.
 * Avoids client redirect loops with server billing gate.
 */
export function BillingGateShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasBillingAccess, loading } = useBillingAccess();

  const hasAccess =
    hasBillingAccess === true || readCachedBillingAccess() === true;
  const needsPurchase =
    !loading && hasBillingAccess === false && readCachedBillingAccess() !== true;
  const lockedToBilling =
    needsPurchase && isBillingPath(pathname) && !isBillingFulfillPath(pathname);

  useEffect(() => {
    if (!hasAccess) return;
    if (pathname !== "/billing") return;
    if (searchParams.get("required") !== "1") return;
    const checkout = searchParams.get("checkout");
    if (checkout === "success" || checkout === "error") return;
    router.replace("/billing", { scroll: false });
  }, [hasAccess, pathname, router, searchParams]);

  if (isPublicAppPath(pathname)) {
    return <>{children}</>;
  }

  if (lockedToBilling) {
    return <BillingOnboardingShell>{children}</BillingOnboardingShell>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
