/** When true, authenticated users bypass the subscription gate (local dev). */
export function isSubscriptionGateSkipped(): boolean {
  return process.env.SKIP_SUBSCRIPTION_GATE === "true";
}

const BILLING_PAGE_PREFIXES = ["/billing"];

const BILLING_API_EXACT = new Set([
  "/api/billing/checkout",
  "/api/billing/plans",
  "/api/billing/account",
  "/api/billing/checkout/complete",
]);

/** Paths that do not require a completed purchase (auth + billing checkout flow). */
export function isBillingGateExemptPath(pathname: string): boolean {
  if (pathname === "/api/billing/webhook") return true;
  return BILLING_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** API routes allowed before the user has billing access. */
export function isBillingGateExemptApi(pathname: string): boolean {
  return BILLING_API_EXACT.has(pathname);
}

export function billingRequiredUrl(origin: string): string {
  const url = new URL("/billing", origin);
  url.searchParams.set("required", "1");
  return url.toString();
}
