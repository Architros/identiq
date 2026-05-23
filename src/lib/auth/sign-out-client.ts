import { createClient } from "@/lib/supabase/client";
import {
  clearIdentiqClientStorage,
  dispatchAuthSignedOut,
} from "@/lib/auth/client-storage";

/**
 * Ends the Supabase session in the browser, clears Identiq local state,
 * then navigates to the server sign-out route so httpOnly cookies are removed.
 */
export async function signOutClient(): Promise<void> {
  dispatchAuthSignedOut();

  try {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
  } catch {
    // Server route still clears cookies.
  }

  clearIdentiqClientStorage();
  window.location.assign("/auth/signout");
}
