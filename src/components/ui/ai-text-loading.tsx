"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type AITextLoadingProps = {
  texts?: string[];
  className?: string;
  interval?: number;
  /** Tighter layout for inline progress (skeleton, chat). */
  compact?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "text-sm font-semibold",
  md: "text-xl font-bold",
  lg: "text-3xl font-bold",
} as const;

export function AITextLoading({
  texts = [
    "Thinking…",
    "Processing…",
    "Analyzing…",
    "Computing…",
    "Almost there…",
  ],
  className,
  interval = 1500,
  compact = false,
  size = "md",
}: AITextLoadingProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const textKey = texts.join("\0");

  useEffect(() => {
    setCurrentTextIndex(0);
  }, [textKey]);

  useEffect(() => {
    if (texts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % texts.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval, textKey, texts.length]);

  const label = texts[currentTextIndex] ?? texts[0];

  return (
    <div
      className={cn(
        "flex items-center justify-start",
        compact ? "p-0" : "p-8",
        className,
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <motion.div
        animate={{ opacity: 1 }}
        className={cn("relative w-full", compact ? "" : "px-4 py-2")}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={`${currentTextIndex}-${label}`}
            animate={{
              opacity: 1,
              y: 0,
              backgroundPosition: ["200% center", "-200% center"],
            }}
            className={cn(
              "inline-block min-w-0 bg-[length:200%_100%] bg-gradient-to-r from-foreground via-muted to-foreground bg-clip-text text-transparent",
              sizeClasses[size],
            )}
            exit={{ opacity: 0, y: -12 }}
            initial={{ opacity: 0, y: 12 }}
            transition={{
              opacity: { duration: 0.3 },
              y: { duration: 0.3 },
              backgroundPosition: {
                duration: 2.5,
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
              },
            }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
