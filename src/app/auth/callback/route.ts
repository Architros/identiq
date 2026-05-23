import { NextResponse } from "next/server";
import {
  billingRequiredUrl,
  isSubscriptionGateSkipped,
} from "@/lib/billing/billing-gate";
import { userHasBillingAccess } from "@/lib/db/repositories/billing";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/billing";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (
        user &&
        !isSubscriptionGateSkipped() &&
        !(await userHasBillingAccess(user.id))
      ) {
        return NextResponse.redirect(billingRequiredUrl(origin));
      }

      const redirectTo = next.startsWith("/") ? next : "/";
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
