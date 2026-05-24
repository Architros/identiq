import "server-only";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loginPathWithNext } from "@/lib/auth/protected-paths";

/**
 * Server Component guard — redirects anonymous users to login before rendering.
 */
export async function requirePageSession(nextPath = "/") {
  if (!isSupabaseConfigured()) {
    return;
  }

  const user = await getSession();
  if (!user) {
    redirect(loginPathWithNext(nextPath));
  }
}
