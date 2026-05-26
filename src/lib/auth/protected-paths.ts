/** API routes callable without a signed-in session (marketing site, etc.). */
export function isPublicApiPath(pathname: string): boolean {
  return pathname === "/api/billing/plans/public";
}

/** Routes that do not require a signed-in Supabase session. */
export function isPublicAppPath(pathname: string): boolean {
  if (pathname === "/login") return true;
  if (pathname === "/privacy" || pathname === "/terms") return true;
  if (pathname.startsWith("/auth/")) return true;
  if (pathname.startsWith("/billing/simulated/")) return true;
  return false;
}

export function loginPathWithNext(pathname: string, search = ""): string {
  const next = pathname === "/" && !search ? "/" : `${pathname}${search}`;
  if (next === "/" || next === "/login") {
    return "/login";
  }
  return `/login?next=${encodeURIComponent(next)}`;
}
