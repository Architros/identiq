"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectToBillingComplete() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const session = searchParams.get("session");
    router.replace(
      session
        ? `/billing/complete?session=${encodeURIComponent(session)}`
        : "/",
    );
  }, [router, searchParams]);

  return <p className="text-sm text-muted">Redirecting…</p>;
}

/** Legacy URL — forwards to `/billing/complete`. */
export default function SimulatedCheckoutCompletePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <RedirectToBillingComplete />
      </Suspense>
    </div>
  );
}
