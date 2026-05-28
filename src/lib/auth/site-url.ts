/**
 * Canonical site URL for server-side redirects (emails, Stripe, Supabase recovery).
 * Prefer NEXT_PUBLIC_SITE_URL in production; never use localhost from the browser.
 */
export function getServerSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

/**
 * OAuth and client-visible auth redirects must use the current browser origin
 * so production builds are not pinned to localhost via NEXT_PUBLIC_SITE_URL.
 */
export function getBrowserAuthOrigin(): string {
  if (typeof window === "undefined") return getServerSiteUrl();
  return window.location.origin;
}
