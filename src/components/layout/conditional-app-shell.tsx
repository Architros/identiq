"use client";

import { usePathname } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const BARE_PATH_PREFIXES = ["/login", "/auth/", "/billing/simulated/"];

/** Paths that should not use the dashboard chrome (full-bleed layouts). */
const BARE_EXACT_PATHS = new Set(["/new-brand"]);

function isBarePath(pathname: string): boolean {
  if (BARE_EXACT_PATHS.has(pathname)) return true;
  return BARE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}

export function ConditionalAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isBarePath(pathname)) {
    return <>{children}</>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
