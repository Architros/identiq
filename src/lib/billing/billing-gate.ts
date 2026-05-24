/** When true, authenticated users bypass the subscription gate (local dev). */
export function isSubscriptionGateSkipped(): boolean {
  return process.env.SKIP_SUBSCRIPTION_GATE === "true";
}

const BILLING_PAGE_PREFIXES = ["/billing"];
const LEGAL_PAGE_PREFIXES = ["/privacy", "/terms"];

const BILLING_API_EXACT = new Set([
  "/api/billing/checkout",
  "/api/billing/plans",
  "/api/billing/account",
  "/api/billing/access",
  "/api/billing/checkout/complete",
  "/api/billing/portal",
]);

/** Paths that do not require a completed purchase (auth + billing checkout flow). */
export function isBillingGateExemptPath(pathname: string): boolean {
  if (pathname === "/api/billing/webhook") return true;
  if (
    LEGAL_PAGE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return true;
  }
  return BILLING_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** API routes allowed before the user has billing access. */
export function isBillingGateExemptApi(pathname: string): boolean {
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname === "/api/me") return true;
  if (pathname === "/api/feedback") return true;
  return BILLING_API_EXACT.has(pathname);
}

export function billingRequiredUrl(origin: string): string {
  const url = new URL("/billing", origin);
  url.searchParams.set("required", "1");
  return url.toString();
}
