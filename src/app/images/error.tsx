"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

type ImagesErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ImagesError({ error, reset }: ImagesErrorProps) {
  useEffect(() => {
    console.error("[images] route error", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
      <h2 className="font-display text-2xl font-normal text-foreground">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted">
        Brand assets could not load. Try again or reload the page.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="primary" size="md" onClick={() => reset()}>
          Try again
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={() => window.location.reload()}
        >
          Reload page
        </Button>
      </div>
    </div>
  );
}
