/** Client-only keys that must not leak across users on shared browsers. */
const IDENTIQ_STORAGE_PREFIXES = ["identiq_"] as const;

export function clearIdentiqClientStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (IDENTIQ_STORAGE_PREFIXES.some((p) => key.startsWith(p))) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // Private mode / blocked storage
  }
}

export const AUTH_SIGNED_OUT_EVENT = "identiq:auth-signed-out";
export const AUTH_SIGNED_IN_EVENT = "identiq:auth-signed-in";
/** Fired when checkout completes or billing access is confirmed. */
export const BILLING_ACCESS_GRANTED_EVENT = "identiq:billing-access-granted";

const BILLING_ACCESS_CACHE_KEY = "identiq_billing_access";

/** Optimistic client hint (session); httpOnly cookie is authoritative for middleware. */
export function readCachedBillingAccess(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(BILLING_ACCESS_CACHE_KEY);
    if (value === "1") return true;
    if (value === "0") return false;
  } catch {
    // Private mode
  }
  return null;
}

export function writeCachedBillingAccess(hasAccess: boolean): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BILLING_ACCESS_CACHE_KEY, hasAccess ? "1" : "0");
  } catch {
    // Private mode
  }
}

export function dispatchAuthSignedOut(): void {
  window.dispatchEvent(new Event(AUTH_SIGNED_OUT_EVENT));
}

export function dispatchAuthSignedIn(): void {
  window.dispatchEvent(new Event(AUTH_SIGNED_IN_EVENT));
}

export function dispatchBillingAccessGranted(): void {
  writeCachedBillingAccess(true);
  window.dispatchEvent(new Event(BILLING_ACCESS_GRANTED_EVENT));
}
