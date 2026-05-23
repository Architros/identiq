"use client";

import { useEffect } from "react";
import { useCredits } from "@/contexts/credits-context";

/** @deprecated Plans moved to /billing — redirects when legacy modal is opened. */
export function ChoosePlanModal() {
  const { buyTokensOpen, openBuyTokens, closeBuyTokens } = useCredits();

  useEffect(() => {
    if (buyTokensOpen) {
      closeBuyTokens();
      openBuyTokens();
    }
  }, [buyTokensOpen, closeBuyTokens, openBuyTokens]);

  return null;
}
