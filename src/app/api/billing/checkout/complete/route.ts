import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/with-auth";
import { getBillingProvider } from "@/lib/billing";

const bodySchema = z.object({
  sessionId: z.string().uuid(),
});

/** Client fallback when server redirect on /billing/complete is not used. */
export async function POST(request: Request) {
  return withAuth(null, async (user) => {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    const billing = getBillingProvider();
    const { balance } = await billing.fulfillCheckout(
      parsed.data.sessionId,
      user.id,
    );

    return NextResponse.json({ balance, completed: true });
  });
}
