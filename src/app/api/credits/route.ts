import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { getTokenBalance } from "@/lib/db/repositories/credits";
import { getAssetStorageEntitlement } from "@/lib/db/repositories/entitlements";

export async function GET() {
  return withAuth(null, async (user) => {
    const [balance, storage] = await Promise.all([
      getTokenBalance(user.id),
      getAssetStorageEntitlement(user.id),
    ]);
    return NextResponse.json({ balance, storage });
  });
}
