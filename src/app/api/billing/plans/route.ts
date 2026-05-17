import { NextResponse } from "next/server";
import { listActivePlans } from "@/lib/db/repositories/billing";

export async function GET() {
  const plans = await listActivePlans();
  return NextResponse.json({ plans });
}
