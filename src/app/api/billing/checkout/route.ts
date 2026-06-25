import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/with-auth";
import { getBillingProvider } from "@/lib/billing";
import { WELCOME_OFFER_ENABLED } from "@/lib/billing/plan-catalog";

const bodySchema = z.object({
  planId: z.enum(["starter", "pro", "studio", "welcome", "custom"]),
  interval: z.enum(["monthly", "annual"]).optional().default("monthly"),
  customTokenAmount: z.number().int().optional(),
});

export async function POST(request: Request) {
  return withAuth("billing:purchase", async (user) => {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const { planId, interval, customTokenAmount } = parsed.data;

    if (planId === "custom" && customTokenAmount == null) {
      return NextResponse.json(
        { error: "customTokenAmount is required for custom packs" },
        { status: 400 },
      );
    }

    if (planId === "welcome" && !WELCOME_OFFER_ENABLED) {
      return NextResponse.json(
        { error: "Welcome offer is not available" },
        { status: 400 },
      );
    }

    if (planId === "welcome" && interval === "annual") {
      return NextResponse.json(
        { error: "Welcome offer is one-time only" },
        { status: 400 },
      );
    }

    try {
      const billing = getBillingProvider();
      const session = await billing.createCheckoutSession({
        userId: user.id,
        userEmail: user.email,
        planId,
        interval,
        customTokenAmount,
      });

      return NextResponse.json({
        sessionId: session.sessionId,
        ...(session.url
          ? { url: session.url }
          : {
              completeUrl:
                session.completeUrl ??
                `/billing/complete?session=${session.sessionId}`,
            }),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Checkout failed";
      const status =
        message.includes("Welcome offer") ||
        message.includes("between") ||
        message.includes("required")
          ? 400
          : 500;
      return NextResponse.json({ error: message }, { status });
    }
  });
}
