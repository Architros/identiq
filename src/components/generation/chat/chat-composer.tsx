"use client";

import { GenerationComposer } from "@/components/generation/generation-composer";
import { useGeneration } from "@/contexts/generation-context";

export function ChatComposer() {
  const { errorMessage, clearError } = useGeneration();

  return (
    <GenerationComposer
      layout="footer"
      errorMessage={errorMessage}
      onDismissError={clearError}
    />
  );
}
