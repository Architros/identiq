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

export function dispatchAuthSignedOut(): void {
  window.dispatchEvent(new Event(AUTH_SIGNED_OUT_EVENT));
}

export function dispatchAuthSignedIn(): void {
  window.dispatchEvent(new Event(AUTH_SIGNED_IN_EVENT));
}
