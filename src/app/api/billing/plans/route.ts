import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import {
  formatUsd,
  WELCOME_OFFER_ENABLED,
  type BillingInterval,
} from "@/lib/billing/plan-catalog";
import {
  listSubscriptionDisplayPacksFromDb,
  welcomeDisplayFromDb,
} from "@/lib/billing/plan-from-db";
import {
  listActivePlans,
  userHasRedeemedWelcomeOffer,
} from "@/lib/db/repositories/billing";
import { listActiveScalePlanPrices } from "@/lib/db/repositories/scale-plan-prices";

export async function GET(request: Request) {
  return withAuth(null, async (user) => {
    const { searchParams } = new URL(request.url);
    const interval = (
      searchParams.get("interval") === "annual" ? "annual" : "monthly"
    ) as BillingInterval;

    const [dbPlans, redeemedWelcome, scaleTiers] = await Promise.all([
      listActivePlans(),
      userHasRedeemedWelcomeOffer(user.id),
      listActiveScalePlanPrices(),
    ]);
    const welcomeEligible =
      WELCOME_OFFER_ENABLED && !redeemedWelcome;

    const packs = listSubscriptionDisplayPacksFromDb(dbPlans, interval);
    const welcomePlan = dbPlans.find((p) => p.id === "welcome") ?? null;
    const welcomeDisplay = welcomeDisplayFromDb(welcomePlan);

    return NextResponse.json({
      interval,
      packs,
      welcome: welcomeEligible && welcomeDisplay
        ? {
            ...welcomeDisplay,
            priceLabel: formatUsd(welcomeDisplay.displayPriceCents),
          }
        : null,
      welcomeEligible,
      scaleTiers,
    });
  });
}
