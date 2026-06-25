import { NextResponse } from "next/server";
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
  publicPlansPreflightResponse,
  withPublicPlansCors,
} from "@/lib/billing/public-plans-cors";
import { listActivePlans } from "@/lib/db/repositories/billing";
import { listActiveScalePlanPrices } from "@/lib/db/repositories/scale-plan-prices";

export async function OPTIONS(request: Request) {
  const preflight = publicPlansPreflightResponse(request);
  return preflight ?? new NextResponse(null, { status: 405 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const interval = (
    searchParams.get("interval") === "annual" ? "annual" : "monthly"
  ) as BillingInterval;

  const [dbPlans, scaleTiers] = await Promise.all([
    listActivePlans(),
    listActiveScalePlanPrices(),
  ]);

  const packs = listSubscriptionDisplayPacksFromDb(dbPlans, interval);
  const welcomePlan = dbPlans.find((p) => p.id === "welcome") ?? null;
  const welcomeDisplay = welcomeDisplayFromDb(welcomePlan);
  const welcomeEligible = WELCOME_OFFER_ENABLED && welcomeDisplay != null;

  const body = NextResponse.json({
    interval,
    packs,
    welcome:
      welcomeEligible && welcomeDisplay
        ? {
            ...welcomeDisplay,
            priceLabel: formatUsd(welcomeDisplay.displayPriceCents),
          }
        : null,
    welcomeEligible,
    scaleTiers,
  });

  return withPublicPlansCors(request, body);
}
