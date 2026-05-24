import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePurchasedPlan, withAuth } from "@/lib/api/with-auth";
import { deductTokens } from "@/lib/db/repositories/credits";

const bodySchema = z.object({
  amount: z.number().int().positive(),
  referenceType: z.string().min(1),
  referenceId: z.string().min(1),
  idempotencyKey: z.string().min(1),
});

export async function POST(request: Request) {
  return withAuth("brand:generate", async (user) => {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await deductTokens({
      userId: user.id,
      ...parsed.data,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Insufficient tokens", balance: result.balance },
        { status: 402 },
      );
    }

    return NextResponse.json(result);
  }, requirePurchasedPlan);
}
