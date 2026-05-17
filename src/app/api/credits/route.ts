import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { getTokenBalance } from "@/lib/db/repositories/credits";

export async function GET() {
  return withAuth(null, async (user) => {
    const balance = await getTokenBalance(user.id);
    return NextResponse.json({ balance });
  });
}
