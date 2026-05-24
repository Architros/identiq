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
import { syncUserStorageLimitFromPurchases } from "@/lib/db/repositories/storage-sync";

export async function GET() {
  return withAuth(null, async (user) => {
    const syncWork = Promise.all([
      syncSubscriptionFromStripe(user.id),
      cleanupOrphanSubscriptionForWelcomeOnly(user.id),
      ensureUserSubscriptionRecord(user.id),
    ]).catch((err) => {
      console.error("[billing/account] subscription sync failed:", err);
    });

    const [balance, storage, subscription, hasBillingAccess, stripeCustomerId] =
      await Promise.all([
        getTokenBalance(user.id),
        getAssetStorageEntitlement(user.id, { syncFromPurchases: false }),
        getSubscriptionSummary(user.id),
        isSubscriptionGateSkipped()
          ? Promise.resolve(true)
          : userHasBillingAccess(user.id),
        getStripeCustomerIdForUser(user.id),
      ]);

    void syncWork;

    if (hasBillingAccess) {
      void syncUserStorageLimitFromPurchases(user.id).catch((err) => {
        console.error("[billing/account] storage sync failed:", err);
      });
    }

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
