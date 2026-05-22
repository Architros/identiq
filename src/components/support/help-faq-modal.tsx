"use client";

import { useState } from "react";
import { AppModal } from "@/components/shared/app-modal";
import { useSupportModals } from "@/contexts/support-modals-context";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    id: "tokens",
    question: "How do tokens work?",
    answer:
      "Tokens are used when you generate images in Studio, remix library templates, or run brand starter packs. Your balance appears in the top bar. Purchase more anytime from Manage Subscription in your profile menu.",
  },
  {
    id: "brands",
    question: "How do I create or switch brands?",
    answer:
      "Use New Brand in the header or the brand selector to start a wizard. Each brand has its own memory, assets, and generation history. Switch brands from the selector without leaving the app.",
  },
  {
    id: "studio",
    question: "What is Studio?",
    answer:
      "Studio is where you pick a format preset (LinkedIn, Instagram, ads, and more), add optional direction, and generate on-brand images in one click. You can attach reference images for style guidance.",
  },
  {
    id: "library",
    question: "What is the Library?",
    answer:
      "Library lets you browse ad templates from top brands and recreate them with your active brand. Open a template, then remix it on Brand assets or Studio.",
  },
  {
    id: "storage",
    question: "Is there a limit on saved assets?",
    answer:
      "Yes. Each plan includes a cap on stored generated assets in your library. Upgrade your pack if you need more room.",
  },
] as const;

type HelpFaqModalProps = {
  open: boolean;
  onClose: () => void;
};

export function HelpFaqModal({ open, onClose }: HelpFaqModalProps) {
  const { openFeedback } = useSupportModals();
  const [expandedId, setExpandedId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Help & FAQ"
      description="Answers to common questions about identiq."
      panelClassName="max-w-xl"
      titleId="help-faq-title"
    >
      <ul className="space-y-2">
        {FAQ_ITEMS.map((item) => {
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

      <p className={cn("mt-6 rounded-xl bg-sidebar-active/40 px-4 py-3 text-sm text-muted")}>
        Still stuck?{" "}
        <button
          type="button"
          onClick={() => {
            onClose();
            openFeedback();
          }}
          className="cursor-pointer font-medium text-accent hover:underline"
        >
          Send feedback
        </button>{" "}
        from the sidebar and we&apos;ll follow up in-app.
      </p>
    </AppModal>
  );
}
