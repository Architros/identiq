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
  deductTokens: (amount: number) => boolean;
  addTokens: (amount: number) => void;
  buyTokensOpen: boolean;
  openBuyTokens: () => void;
  closeBuyTokens: () => void;
};

const CreditsContext = createContext<CreditsContextValue | null>(null);

const CREDITS_STORAGE_KEY = "identiq_available_tokens";

function readStoredTokens(): number {
  if (typeof window === "undefined") return mockCredits;
  const raw = sessionStorage.getItem(CREDITS_STORAGE_KEY);
  if (!raw) return mockCredits;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : mockCredits;
}

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [availableTokens, setAvailableTokens] = useState(() =>
    typeof window === "undefined" ? mockCredits : readStoredTokens(),
  );
  const [buyTokensOpen, setBuyTokensOpen] = useState(false);

  useEffect(() => {
    sessionStorage.setItem(CREDITS_STORAGE_KEY, String(availableTokens));
  }, [availableTokens]);

  const addTokens = useCallback((amount: number) => {
    if (amount <= 0) return;
    setAvailableTokens((current) => current + amount);
  }, []);

  const openBuyTokens = useCallback(() => setBuyTokensOpen(true), []);
  const closeBuyTokens = useCallback(() => setBuyTokensOpen(false), []);

  const deductTokens = useCallback((amount: number) => {
    if (amount <= 0) return true;
    let success = false;
    setAvailableTokens((current) => {
      if (current < amount) return current;
      success = true;
      return current - amount;
    });
    return success;
  }, []);

  const value = useMemo(
    () => ({
      availableTokens,
      deductTokens,
      addTokens,
      buyTokensOpen,
      openBuyTokens,
      closeBuyTokens,
    }),
    [
      availableTokens,
      deductTokens,
      addTokens,
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
