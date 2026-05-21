"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Megaphone01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HomeLibraryCollage } from "@/components/home/home-library-collage";

export function AdLibraryFeature() {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex min-h-[280px] overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface lg:min-h-[320px]"
    >
      <div className="flex flex-1 flex-col justify-center gap-4 p-8 lg:max-w-[42%]">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-muted">
          <HugeiconsIcon
            icon={Megaphone01Icon}
            size={18}
            color="currentColor"
            strokeWidth={1.75}
          />
          Library
        </span>
        <h2 className="font-display text-3xl leading-tight tracking-tight text-foreground lg:text-4xl">
          Remix ads from top{" "}
          <em className="font-display italic text-accent">brands</em>
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          Browse real campaign layouts and apply them to your brand kit in one
          click.
        </p>
        <Link
          href="/library"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-accent"
        >
          Browse Library
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.75}
          />
        </Link>
      </div>

      <Link
        href="/library"
        className="hidden min-w-0 flex-1 sm:block"
        aria-label="Browse Library templates"
      >
        <HomeLibraryCollage />
      </Link>
    </motion.article>
  );
}
