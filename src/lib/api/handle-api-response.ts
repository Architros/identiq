import {
  isPublicAppPath,
  loginPathWithNext,
} from "@/lib/auth/protected-paths";

/** Returns true when response is a service-unavailable signal (caller should use local fallback). */
export function isServiceUnavailableResponse(res: Response): boolean {
  return res.status === 503;
}

export function isUnauthorizedResponse(res: Response): boolean {
  return res.status === 401;
}

export function redirectToLogin(nextPath?: string): void {
  if (typeof window === "undefined") return;

  const pathname = window.location.pathname;
  const search = window.location.search;

  if (isPublicAppPath(pathname) && !nextPath) {
    return;
  }

  const next = nextPath ?? `${pathname}${search}`;
  const target = loginPathWithNext(next);

  if (`${pathname}${search}` === target || pathname === "/login") {
    return;
  }

  window.location.assign(target);
}

/** True when the API blocked the user for missing a completed purchase. */
export async function isSubscriptionRequiredResponse(
  res: Response,
): Promise<boolean> {
  if (res.status !== 403) return false;
  try {
    const data = (await res.clone().json()) as { error?: string };
    return data.error === "subscription_required";
  } catch {
    return false;
  }
}

export function redirectToBillingRequired(): void {
  if (typeof window !== "undefined") {
    window.location.assign("/billing?required=1");
  }
}
