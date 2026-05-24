import { isSubscriptionGateSkipped } from "@/lib/billing/billing-gate";
import { userHasBillingAccess } from "@/lib/billing/check-billing-access";
import {
  DASHBOARD_PATH,
  SUBSCRIPTION_PATH,
  resolveDestinationPath,
  sanitizeNextPath,
} from "@/lib/auth/post-auth-destination";

export {
  DASHBOARD_PATH,
  SUBSCRIPTION_PATH,
  isBillingOnboardingPath,
  resolveDestinationPath,
  sanitizeNextPath,
} from "@/lib/auth/post-auth-destination";

/**
 * Path to send the user after OAuth or email OTP (relative, no origin).
 */
export async function resolvePostAuthPath(
  userId: string,
  next: string | null | undefined,
): Promise<string> {
  if (isSubscriptionGateSkipped()) {
    return sanitizeNextPath(next);
  }

  const hasAccess = await userHasBillingAccess(userId);
  return resolveDestinationPath(hasAccess, next);
}
