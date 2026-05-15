"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Megaphone01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

const adPlaceholders = [
  { bg: "from-violet-200 to-purple-300", label: "ADP" },
  { bg: "from-blue-200 to-cyan-300", label: "Webflow" },
  { bg: "from-pink-200 to-rose-300", label: "Canva" },
  { bg: "from-amber-200 to-orange-300", label: "Personio" },
  { bg: "from-emerald-200 to-teal-300", label: "Brand" },
  { bg: "from-indigo-200 to-blue-300", label: "Ads" },
  { bg: "from-fuchsia-200 to-pink-300", label: "Social" },
  { bg: "from-slate-200 to-gray-300", label: "Media" },
];

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
          Ad Library
        </span>
        <h2 className="font-display text-3xl leading-tight tracking-tight text-foreground lg:text-4xl">
          Recreate ads from top{" "}
          <em className="font-display italic text-accent">Media</em> brands
        </h2>
        <button
          type="button"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-accent"
        >
          Browse
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.75}
          />
        </button>
      </div>

      <div className="hidden flex-1 grid-cols-4 gap-2 p-4 sm:grid">
        {adPlaceholders.map((item, index) => (
          <div
            key={item.label}
            className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${item.bg} ${
              index % 3 === 0 ? "col-span-2 row-span-2" : ""
            } ${index === 1 ? "row-span-2" : ""}`}
          >
            <span className="absolute bottom-2 left-2 rounded bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </motion.article>
  );
}
