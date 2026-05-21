"use client";

import { useEffect } from "react";
import { useGeneration } from "@/contexts/generation-context";

/** Locks main scroll while the generation chat is open. */
export function GenerationMainChrome({ children }: { children: React.ReactNode }) {
  const { view } = useGeneration();

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    if (view === "chat") {
      main.classList.add("overflow-hidden");
    } else {
      main.classList.remove("overflow-hidden");
    }
    return () => main.classList.remove("overflow-hidden");
  }, [view]);

  return children;
}
