/** Returns true when response is a service-unavailable signal (caller should use local fallback). */
export function isServiceUnavailableResponse(res: Response): boolean {
  return res.status === 503;
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
