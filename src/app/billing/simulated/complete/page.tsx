"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCredits } from "@/contexts/credits-context";

function CompleteCheckout() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshBalance } = useCredits();
  const sessionId = searchParams.get("session");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing checkout session.");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/billing/checkout/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = (await res.json()) as {
          balance?: number;
          error?: string;
        };
        if (!res.ok) {
          if (!cancelled) setError(data.error ?? "Checkout failed");
          return;
        }
        await refreshBalance(data.balance);
        if (!cancelled) router.replace("/");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Checkout failed");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, router, refreshBalance]);

  if (error) {
    return (
      <p className="text-sm text-red-600">{error}</p>
    );
  }

  return <p className="text-sm text-muted">Completing purchase…</p>;
}

export default function SimulatedCheckoutCompletePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <CompleteCheckout />
      </Suspense>
    </div>
  );
}
