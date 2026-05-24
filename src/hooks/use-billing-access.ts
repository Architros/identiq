"use client";

import { useCallback, useEffect, useState } from "react";
import { AUTH_SIGNED_IN_EVENT, AUTH_SIGNED_OUT_EVENT } from "@/lib/auth/client-storage";

type BillingAccessState = {
  hasBillingAccess: boolean | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

export function useBillingAccess(): BillingAccessState {
  const [hasBillingAccess, setHasBillingAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/access", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (res.status === 401) {
        setHasBillingAccess(false);
        return;
      }
      if (!res.ok) {
        setHasBillingAccess(false);
        return;
      }
      const data = (await res.json()) as { hasBillingAccess?: boolean };
      setHasBillingAccess(Boolean(data.hasBillingAccess));
    } catch {
      setHasBillingAccess(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onAuthChange = () => void refresh();
    window.addEventListener(AUTH_SIGNED_IN_EVENT, onAuthChange);
    window.addEventListener(AUTH_SIGNED_OUT_EVENT, onAuthChange);
    return () => {
      window.removeEventListener(AUTH_SIGNED_IN_EVENT, onAuthChange);
      window.removeEventListener(AUTH_SIGNED_OUT_EVENT, onAuthChange);
    };
  }, [refresh]);

  return { hasBillingAccess, loading, refresh };
}
