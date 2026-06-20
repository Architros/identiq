"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  dispatchAuthSignedIn,
  dispatchAuthSignedOut,
} from "@/lib/auth/client-storage";
import { createClient } from "@/lib/supabase/client";

/**
 * Syncs Supabase auth events to Identiq providers and triggers a server refresh
 * after sign-in so RSC/API routes see the new session cookies.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let hasActiveSession = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        hasActiveSession = false;
        dispatchAuthSignedOut();
        return;
      }

      const sessionPresent = Boolean(session);

      // TOKEN_REFRESHED (and INITIAL_SESSION) can fire when the tab regains focus.
      // Do not remount providers or refetch header data — that aborts generation.
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        hasActiveSession = sessionPresent;
        return;
      }

      if (event === "SIGNED_IN") {
        if (!hasActiveSession && sessionPresent) {
          hasActiveSession = true;
          dispatchAuthSignedIn();
          router.refresh();
        } else if (sessionPresent) {
          hasActiveSession = true;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return <>{children}</>;
}
