"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ThinkingBlockProps = {
  isStreaming: boolean;
  textContent: string;
  reasoningContent: string;
};

function formatThoughtLabel(seconds: number, isStreaming: boolean): string {
  if (isStreaming) {
    return seconds > 0 ? `Thinking… ${seconds}s` : "Thinking…";
  }
  if (seconds <= 0) return "Thought for a moment";
  if (seconds === 1) return "Thought for 1 second";
  return `Thought for ${seconds} seconds`;
}

export function ThinkingBlock({
  isStreaming,
  textContent,
  reasoningContent,
}: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(true);
  const [elapsedSec, setElapsedSec] = useState(0);
  const startRef = useRef<number | null>(null);
  const wasStreamingRef = useRef(false);

  useEffect(() => {
    if (isStreaming) {
      if (startRef.current === null) {
        startRef.current = Date.now();
      }
      wasStreamingRef.current = true;
      setExpanded(true);

      const tick = window.setInterval(() => {
        if (startRef.current !== null) {
          setElapsedSec(
            Math.max(1, Math.floor((Date.now() - startRef.current) / 1000)),
          );
        }
      }, 500);

      return () => window.clearInterval(tick);
    }

    if (wasStreamingRef.current && startRef.current !== null) {
      const finalSec = Math.max(
        1,
        Math.ceil((Date.now() - startRef.current) / 1000),
      );
      setElapsedSec(finalSec);
      startRef.current = null;
      setExpanded(false);
    }
  }, [isStreaming]);

  const hasReasoning = reasoningContent.trim().length > 0;
  const hasText = textContent.trim().length > 0;
  const hasContent = hasReasoning || hasText;

  if (!hasContent && !isStreaming) return null;

  const label = formatThoughtLabel(elapsedSec, isStreaming);

  return (
    <div className="rounded-xl border border-border/60 bg-sidebar-active/50">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-medium text-foreground"
      >
        <span className="flex min-w-0 items-center gap-2">
          {isStreaming ? (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
          ) : (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs text-accent">
              ✓
            </span>
          )}
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 text-xs text-muted">
          {expanded ? "Hide" : "Show thought"}
        </span>
      </button>

      {expanded ? (
        <div className="space-y-3 border-t border-border/50 px-4 py-3">
          {isStreaming && !hasContent ? (
            <p className="text-sm text-muted">
              Refining your prompt with brand context…
            </p>
          ) : null}

          {hasReasoning ? (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Reasoning
              </p>
              <p
                className={cn(
                  "whitespace-pre-wrap text-sm leading-relaxed text-muted italic",
                  isStreaming && "animate-pulse",
                )}
              >
                {reasoningContent}
              </p>
            </div>
          ) : null}

          {hasText ? (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {hasReasoning ? "Final prompt draft" : "Brand direction"}
              </p>
              <p
                className={cn(
                  "whitespace-pre-wrap text-sm leading-relaxed text-foreground/90",
                  isStreaming && !hasReasoning && "animate-pulse",
                )}
              >
                {textContent}
                {isStreaming && hasText && !hasReasoning ? (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent align-middle" />
                ) : null}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
