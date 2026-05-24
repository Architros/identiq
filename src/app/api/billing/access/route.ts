import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { userHasBillingAccess } from "@/lib/billing/check-billing-access";

export async function GET() {
  return withAuth(null, async (user) => {
    const hasBillingAccess = await userHasBillingAccess(user.id);
    return NextResponse.json({ hasBillingAccess });
  });
}
