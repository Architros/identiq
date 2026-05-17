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

type CreditsContextValue = {
  availableTokens: number;
  isLoading: boolean;
  refreshBalance: (balance?: number) => Promise<void>;
  /** @deprecated Server deducts tokens; triggers balance refresh. */
  deductTokens: (amount: number) => boolean;
  buyTokensOpen: boolean;
  openBuyTokens: () => void;
  closeBuyTokens: () => void;
};

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [availableTokens, setAvailableTokens] = useState(mockCredits);
  const [isLoading, setIsLoading] = useState(true);
  const [buyTokensOpen, setBuyTokensOpen] = useState(false);

  const refreshBalance = useCallback(async (balance?: number) => {
    if (typeof balance === "number") {
      setAvailableTokens(balance);
      return;
    }
    try {
      const res = await fetch("/api/credits");
      if (res.ok) {
        const data = (await res.json()) as { balance: number };
        setAvailableTokens(data.balance);
      }
    } catch {
      // Keep current balance when API is unavailable.
    }
  }, []);

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
      isLoading,
      refreshBalance,
      deductTokens,
      buyTokensOpen,
      openBuyTokens,
      closeBuyTokens,
    }),
    [
      availableTokens,
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
