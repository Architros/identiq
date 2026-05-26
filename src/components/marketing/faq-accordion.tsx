"use client";

import { useState } from "react";
import { FAQ_ITEMS, type FaqItem } from "@/content/faq-items";
import { cn } from "@/lib/utils";

type FaqAccordionProps = {
  items?: readonly FaqItem[];
  defaultExpandedId?: string | null;
  className?: string;
};

export function FaqAccordion({
  items = FAQ_ITEMS,
  defaultExpandedId = items[0]?.id ?? null,
  className,
}: FaqAccordionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(defaultExpandedId);

  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item) => {
        const isOpen = expandedId === item.id;
        return (
          <li
            key={item.id}
            className="overflow-hidden rounded-xl border border-border/70 bg-background/50"
          >
            <button
              type="button"
              onClick={() =>
                setExpandedId((prev) => (prev === item.id ? null : item.id))
              }
              className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-sidebar-active/50"
              aria-expanded={isOpen}
            >
              {item.question}
              <span className="shrink-0 text-muted">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen ? (
              <p className="border-t border-border/60 px-4 py-3 text-sm leading-relaxed text-muted">
                {item.answer}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
