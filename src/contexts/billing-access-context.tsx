"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { redirectToLogin } from "@/lib/api/handle-api-response";
import { isPublicAppPath } from "@/lib/auth/protected-paths";
import {
  AUTH_SIGNED_IN_EVENT,
  AUTH_SIGNED_OUT_EVENT,
  BILLING_ACCESS_GRANTED_EVENT,
  readCachedBillingAccess,
  writeCachedBillingAccess,
} from "@/lib/auth/client-storage";

type BillingAccessContextValue = {
  hasBillingAccess: boolean | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const BillingAccessContext = createContext<BillingAccessContextValue | null>(
  null,
);

function isTransientAccessError(status: number): boolean {
  return status === 503 || status === 502 || status === 504 || status === 429;
}

export function BillingAccessProvider({
  children,
  initialHasBillingAccess = null,
}: {
  children: React.ReactNode;
  /** From httpOnly cookie (server) — avoids false "no access" flash. */
  initialHasBillingAccess?: boolean | null;
}) {
  const pathname = usePathname();
  const onPublicRoute = isPublicAppPath(pathname);

  const [hasBillingAccess, setHasBillingAccess] = useState<boolean | null>(
    () => {
      if (initialHasBillingAccess === true) return true;
      return readCachedBillingAccess();
    },
  );
  const [loading, setLoading] = useState(() => {
    if (onPublicRoute) return false;
    return (
      initialHasBillingAccess !== true && readCachedBillingAccess() !== true
    );
  });

  const refresh = useCallback(async () => {
    if (isPublicAppPath(pathname)) {
      setLoading(false);
      return;
    }

    setLoading((currentLoading) => {
      const cached = readCachedBillingAccess();
      return cached === true ? false : currentLoading;
    });
    setHasBillingAccess((current) =>
      current === true ? true : initialHasBillingAccess === true ? true : null,
    );

    try {
      const res = await fetch("/api/billing/access", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (res.status === 401) {
        writeCachedBillingAccess(false);
        setHasBillingAccess(false);
        setLoading(false);
        if (!isPublicAppPath(pathname)) {
          redirectToLogin();
        }
        return;
      }
      if (!res.ok) {
        if (isTransientAccessError(res.status)) {
          return;
        }
        writeCachedBillingAccess(false);
        setHasBillingAccess(false);
        return;
      }
      const data = (await res.json()) as { hasBillingAccess?: boolean };
      const allowed = Boolean(data.hasBillingAccess);
      writeCachedBillingAccess(allowed);
      setHasBillingAccess(allowed);
    } catch {
      // Keep prior / cached / server hint on network errors.
    } finally {
      setLoading(false);
    }
  }, [initialHasBillingAccess, pathname]);

  useEffect(() => {
    if (onPublicRoute) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [onPublicRoute, refresh]);

  useEffect(() => {
    const onSignedIn = () => void refresh();
    const onSignedOut = () => {
      writeCachedBillingAccess(false);
      setHasBillingAccess(false);
      setLoading(false);
    };
    const onAccessGranted = () => {
      writeCachedBillingAccess(true);
      setHasBillingAccess(true);
      setLoading(false);
    };
    window.addEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);
    window.addEventListener(AUTH_SIGNED_OUT_EVENT, onSignedOut);
    window.addEventListener(BILLING_ACCESS_GRANTED_EVENT, onAccessGranted);
    return () => {
      window.removeEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);
      window.removeEventListener(AUTH_SIGNED_OUT_EVENT, onSignedOut);
      window.removeEventListener(BILLING_ACCESS_GRANTED_EVENT, onAccessGranted);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ hasBillingAccess, loading, refresh }),
    [hasBillingAccess, loading, refresh],
  );

  return (
    <BillingAccessContext.Provider value={value}>
      {children}
    </BillingAccessContext.Provider>
  );
}

export function useBillingAccess(): BillingAccessContextValue {
  const ctx = useContext(BillingAccessContext);
  if (!ctx) {
    throw new Error("useBillingAccess must be used within BillingAccessProvider");
  }
  return ctx;
}
