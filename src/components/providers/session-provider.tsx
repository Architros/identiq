"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AUTH_SIGNED_IN_EVENT,
  AUTH_SIGNED_OUT_EVENT,
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        dispatchAuthSignedOut();
        return;
      }
      // TOKEN_REFRESHED fires when the tab regains focus — do not remount the
      // tree or refetch providers; that aborts long-running generation streams.
      if (event === "SIGNED_IN") {
        dispatchAuthSignedIn();
        router.refresh();
      }
    });

    const onSignedIn = () => router.refresh();
    window.addEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);
    };
  }, [router]);

  return <>{children}</>;
}
