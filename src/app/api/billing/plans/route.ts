import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import {
  listDisplayPacks,
  toDisplayPack,
  WELCOME_PACK,
  formatUsd,
  type BillingInterval,
} from "@/lib/billing/plan-catalog";
import {
  listActivePlans,
  userHasCompletedCheckout,
} from "@/lib/db/repositories/billing";

export async function GET(request: Request) {
  return withAuth(null, async (user) => {
    const { searchParams } = new URL(request.url);
    const interval = (
      searchParams.get("interval") === "annual" ? "annual" : "monthly"
    ) as BillingInterval;

    const [dbPlans, welcomeEligible] = await Promise.all([
      listActivePlans(),
      userHasCompletedCheckout(user.id).then((has) => !has),
    ]);

    const displayPacks = listDisplayPacks().map((def) =>
      toDisplayPack(def, interval),
    );

    return NextResponse.json({
      interval,
      packs: displayPacks,
      welcome: welcomeEligible
        ? {
            ...WELCOME_PACK,
            priceLabel: formatUsd(WELCOME_PACK.priceCents),
          }
        : null,
      dbPlans,
      welcomeEligible,
    });
  });
}
