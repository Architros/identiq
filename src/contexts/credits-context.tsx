"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { mockCredits } from "@/lib/mock-data";

type CreditsContextValue = {
  availableTokens: number;
  deductTokens: (amount: number) => boolean;
};

const CreditsContext = createContext<CreditsContextValue | null>(null);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [availableTokens, setAvailableTokens] = useState(mockCredits);

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
    () => ({ availableTokens, deductTokens }),
    [availableTokens, deductTokens],
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
