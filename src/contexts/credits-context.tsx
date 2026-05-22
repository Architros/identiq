"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { mockCredits } from "@/lib/mock-data";
import { useConnectivityOptional } from "@/contexts/connectivity-context";
import { isServiceUnavailableResponse } from "@/lib/api/handle-api-response";

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
  buyTokensOpen: boolean;
  openBuyTokens: () => void;
  closeBuyTokens: () => void;
};

const CreditsContext = createContext<CreditsContextValue | null>(null);

const DEFAULT_STORAGE: AssetStorageUsage = {
  used: 0,
  limit: 25,
  remaining: 25,
};

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [availableTokens, setAvailableTokens] = useState(mockCredits);
  const [assetStorage, setAssetStorage] =
    useState<AssetStorageUsage>(DEFAULT_STORAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [buyTokensOpen, setBuyTokensOpen] = useState(false);
  const connectivity = useConnectivityOptional();

  const refreshBalance = useCallback(async (balance?: number) => {
    if (typeof balance === "number") {
      setAvailableTokens(balance);
      return;
    }
    try {
      const res = await fetch("/api/credits", { credentials: "same-origin" });
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

  const deductTokens = useCallback(
    (_amount: number) => {
      void refreshBalance();
      return true;
    },
    [refreshBalance],
  );

  const openBuyTokens = useCallback(() => setBuyTokensOpen(true), []);
  const closeBuyTokens = useCallback(() => setBuyTokensOpen(false), []);

  const value = useMemo(
    () => ({
      availableTokens,
      assetStorage,
      isLoading,
      refreshBalance,
      deductTokens,
      buyTokensOpen,
      openBuyTokens,
      closeBuyTokens,
    }),
    [
      availableTokens,
      assetStorage,
      isLoading,
      refreshBalance,
      deductTokens,
      buyTokensOpen,
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
