"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

export function CreateImageCard() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="flex min-h-[280px] flex-col justify-between rounded-[var(--radius-card)] border border-border bg-surface p-8 lg:min-h-[320px]"
    >
      <div>
        <h2 className="font-display text-3xl leading-tight tracking-tight text-foreground">
          Create your own image
        </h2>
      </div>
      <Link
        href="/ideas"
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        Try a custom prompt
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.75}
        />
      </Link>
    </motion.article>
  );
}
