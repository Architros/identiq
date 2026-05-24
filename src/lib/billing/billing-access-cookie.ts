import type { NextRequest, NextResponse } from "next/server";

export const BILLING_ACCESS_COOKIE = "identiq_billing_ok";

const COOKIE_OPTS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days — refreshed on successful access checks
  secure: process.env.NODE_ENV === "production",
};

export function hasBillingAccessCookie(request: NextRequest): boolean {
  return request.cookies.get(BILLING_ACCESS_COOKIE)?.value === "1";
}

export function applyBillingAccessCookie(response: NextResponse): void {
  response.cookies.set(BILLING_ACCESS_COOKIE, "1", COOKIE_OPTS);
}

export function clearBillingAccessCookie(response: NextResponse): void {
  response.cookies.set(BILLING_ACCESS_COOKIE, "", {
    ...COOKIE_OPTS,
    maxAge: 0,
  });
}

/** Set after successful checkout fulfillment (server page / action). */
export async function persistBillingAccessCookie(): Promise<void> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  store.set(BILLING_ACCESS_COOKIE, "1", COOKIE_OPTS);
}
