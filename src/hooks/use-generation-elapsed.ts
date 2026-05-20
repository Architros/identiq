"use client";

import { useEffect, useState } from "react";
import { formatElapsedMs } from "@/lib/generation/format-elapsed";

export function useGenerationElapsed(startedAt: number | null): string | null {
  const [elapsed, setElapsed] = useState<string | null>(null);

  useEffect(() => {
    if (startedAt === null) {
      setElapsed(null);
      return;
    }

    const tick = () => {
      setElapsed(formatElapsedMs(Date.now() - startedAt));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  return elapsed;
}
