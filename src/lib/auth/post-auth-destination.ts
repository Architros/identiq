export const DASHBOARD_PATH = "/";
export const SUBSCRIPTION_PATH = "/billing?required=1";

/** Safe in-app path from ?next= query param (defaults to dashboard). */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DASHBOARD_PATH;
  }
  if (next.startsWith("/login")) {
    return DASHBOARD_PATH;
  }
  return next;
}

/** Billing routes used for first-time subscription onboarding, not deep links. */
export function isBillingOnboardingPath(path: string): boolean {
  const pathname = path.split("?")[0] ?? path;
  return pathname === "/billing";
}

/**
 * Where to send the user after sign-in when subscription gate applies.
 * New users → subscriptions; returning subscribers → dashboard or ?next=.
 */
export function resolveDestinationPath(
  hasBillingAccess: boolean,
  next: string | null | undefined,
): string {
  if (!hasBillingAccess) {
    return SUBSCRIPTION_PATH;
  }

  const safeNext = sanitizeNextPath(next);
  if (isBillingOnboardingPath(safeNext)) {
    return DASHBOARD_PATH;
  }

  return safeNext;
}
