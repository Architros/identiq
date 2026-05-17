import { NextResponse } from "next/server";
import { authErrorResponse, getSessionProfile } from "@/lib/auth/session";

export async function GET() {
  try {
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    return authErrorResponse(error);
  }
}
