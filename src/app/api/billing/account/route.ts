import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { isSubscriptionGateSkipped } from "@/lib/billing/billing-gate";
import { userHasBillingAccess } from "@/lib/billing/check-billing-access";
import { getSubscriptionSummary } from "@/lib/db/repositories/billing-account";
import {
  cleanupOrphanSubscriptionForWelcomeOnly,
  ensureUserSubscriptionRecord,
  getStripeCustomerIdForUser,
  syncSubscriptionFromStripe,
} from "@/lib/db/repositories/subscriptions";
import { getTokenBalance } from "@/lib/db/repositories/credits";
import { getAssetStorageEntitlement } from "@/lib/db/repositories/entitlements";

export async function GET() {
  return withAuth(null, async (user) => {
    await syncSubscriptionFromStripe(user.id);
    await cleanupOrphanSubscriptionForWelcomeOnly(user.id);
    await ensureUserSubscriptionRecord(user.id);

    const [balance, storage, subscription, hasBillingAccess, stripeCustomerId] =
      await Promise.all([
        getTokenBalance(user.id),
        getAssetStorageEntitlement(user.id),
        getSubscriptionSummary(user.id),
        isSubscriptionGateSkipped()
          ? Promise.resolve(true)
          : userHasBillingAccess(user.id),
        getStripeCustomerIdForUser(user.id),
      ]);

    return NextResponse.json({
      balance,
      storage,
      subscription,
      hasBillingAccess,
      stripeCustomerId:
        subscription?.isSimulated === true ? null : stripeCustomerId,
    });
  });
}
