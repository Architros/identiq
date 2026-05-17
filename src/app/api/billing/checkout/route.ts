import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/with-auth";
import { getBillingProvider } from "@/lib/billing";

const bodySchema = z.object({
  planId: z.enum(["starter", "pro", "studio"]),
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

    const billing = getBillingProvider();
    const session = await billing.createCheckoutSession({
      userId: user.id,
      planId: parsed.data.planId,
    });

    return NextResponse.json({
      sessionId: session.sessionId,
      completeUrl: `/billing/simulated/complete?session=${session.sessionId}`,
    });
  });
}
