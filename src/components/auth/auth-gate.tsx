"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isPublicAppPath, loginPathWithNext } from "@/lib/auth/protected-paths";
import { createClient } from "@/lib/supabase/client";

type AuthGateProps = {
  children: React.ReactNode;
};

/**
 * Client-side session check — catches stale RSC HTML and client navigations
 * if middleware did not run or cookies were not yet visible to the server.
 */
export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [allowed, setAllowed] = useState(() => isPublicAppPath(pathname));

  useEffect(() => {
    if (isPublicAppPath(pathname)) {
      setAllowed(true);
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    const deny = () => {
      if (cancelled) return;
      const search = searchParams.toString();
      const next = search ? `${pathname}?${search}` : pathname;
      router.replace(loginPathWithNext(next));
    };

    void supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (cancelled) return;
      if (error || !user) {
        deny();
        return;
      }
      setAllowed(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setAllowed(false);
        deny();
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setAllowed(true);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname, router, searchParams]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted">Checking sign-in…</p>
      </div>
    );
  }

  return <>{children}</>;
}
