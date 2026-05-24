"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BillingOnboardingShell } from "@/components/billing/billing-onboarding-shell";
import { BillingPageSkeleton } from "@/components/billing/billing-skeleton";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useBillingAccess } from "@/hooks/use-billing-access";

const BARE_PATH_PREFIXES = ["/login", "/auth/", "/billing/simulated/"];

function isBarePath(pathname: string): boolean {
  return BARE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}

function isBillingPath(pathname: string): boolean {
  return pathname === "/billing" || pathname.startsWith("/billing/");
}

function isBillingFulfillPath(pathname: string): boolean {
  return pathname.startsWith("/billing/complete");
}

export function BillingGateShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasBillingAccess, loading } = useBillingAccess();

  const needsPurchase = !loading && hasBillingAccess === false;
  const lockedToBilling =
    needsPurchase && isBillingPath(pathname) && !isBillingFulfillPath(pathname);

  useEffect(() => {
    if (loading || hasBillingAccess !== false) return;
    if (isBarePath(pathname) || isBillingFulfillPath(pathname)) return;
    if (!isBillingPath(pathname)) {
      router.replace("/billing?required=1");
    } else if (searchParams.get("required") !== "1") {
      router.replace("/billing?required=1");
    }
  }, [hasBillingAccess, loading, pathname, router, searchParams]);

  if (isBarePath(pathname)) {
    return <>{children}</>;
  }

  if (loading) {
    if (isBillingPath(pathname)) {
      return <BillingOnboardingShell>{children}</BillingOnboardingShell>;
    }
    return <BillingPageSkeleton />;
  }

  if (lockedToBilling) {
    return <BillingOnboardingShell>{children}</BillingOnboardingShell>;
  }

  if (needsPurchase && !isBillingPath(pathname)) {
    return <BillingPageSkeleton />;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
