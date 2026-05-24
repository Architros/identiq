"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useConnectivityOptional } from "@/contexts/connectivity-context";
import {
  isServiceUnavailableResponse,
  isUnauthorizedResponse,
  redirectToLogin,
} from "@/lib/api/handle-api-response";
import {
  AUTH_SIGNED_IN_EVENT,
  AUTH_SIGNED_OUT_EVENT,
} from "@/lib/auth/client-storage";

export type AssetStorageUsage = {
  used: number;
  limit: number;
  remaining: number;
};

type CreditsContextValue = {
  availableTokens: number;
  assetStorage: AssetStorageUsage;
  isLoading: boolean;
  refreshBalance: (balance?: number) => Promise<void>;
  /** @deprecated Server deducts tokens; triggers balance refresh. */
  deductTokens: (amount: number) => boolean;
  /** Opens the billing page to buy tokens or manage subscription. */
  openBuyTokens: () => void;
  closeBuyTokens: () => void;
  /** @deprecated Plans live on /billing; always false. */
  buyTokensOpen: boolean;
};

const CreditsContext = createContext<CreditsContextValue | null>(null);

const DEFAULT_STORAGE: AssetStorageUsage = {
  used: 0,
  limit: 25,
  remaining: 25,
};

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [availableTokens, setAvailableTokens] = useState(0);
  const [assetStorage, setAssetStorage] =
    useState<AssetStorageUsage>(DEFAULT_STORAGE);
  const [isLoading, setIsLoading] = useState(true);
  const connectivity = useConnectivityOptional();

  const refreshBalance = useCallback(async (balance?: number) => {
    if (typeof balance === "number") {
      setAvailableTokens(balance);
      return;
    }
    try {
      const res = await fetch("/api/credits", { credentials: "same-origin" });
      if (isUnauthorizedResponse(res)) {
        redirectToLogin();
        return;
      }
      if (isServiceUnavailableResponse(res)) {
        connectivity?.reportServiceUnavailable();
        return;
      }
      if (res.ok) {
        connectivity?.clearConnectivityIssue();
        const data = (await res.json()) as {
          balance: number;
          storage?: AssetStorageUsage;
        };
        setAvailableTokens(data.balance);
        if (data.storage) {
          setAssetStorage(data.storage);
        }
      }
    } catch {
      // Keep current balance when API is unavailable.
    }
  }, [connectivity]);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      await refreshBalance();
      setIsLoading(false);
    })();
  }, [refreshBalance]);

  useEffect(() => {
    const onSignedOut = () => {
      setAvailableTokens(0);
      setAssetStorage(DEFAULT_STORAGE);
      setIsLoading(false);
    };
    const onSignedIn = () => {
      setIsLoading(true);
      void refreshBalance().finally(() => setIsLoading(false));
    };
    window.addEventListener(AUTH_SIGNED_OUT_EVENT, onSignedOut);
    window.addEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);
    return () => {
      window.removeEventListener(AUTH_SIGNED_OUT_EVENT, onSignedOut);
      window.removeEventListener(AUTH_SIGNED_IN_EVENT, onSignedIn);
    };
  }, [refreshBalance]);

  const deductTokens = useCallback(
    (_amount: number) => {
      void refreshBalance();
      return true;
    },
    [refreshBalance],
  );

  const openBuyTokens = useCallback(() => {
    router.push("/billing");
  }, [router]);

  const closeBuyTokens = useCallback(() => {}, []);

  const value = useMemo(
    () => ({
      availableTokens,
      assetStorage,
      isLoading,
      refreshBalance,
      deductTokens,
      buyTokensOpen: false,
      openBuyTokens,
      closeBuyTokens,
    }),
    [
      availableTokens,
      assetStorage,
      isLoading,
      refreshBalance,
      deductTokens,
      openBuyTokens,
      closeBuyTokens,
    ],
  );

  return (
    <CreditsContext.Provider value={value}>{children}</CreditsContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditsContext);
  if (!context) {
    throw new Error("useCredits must be used within CreditsProvider");
  }
  return context;
}
