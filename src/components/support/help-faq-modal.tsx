"use client";

import { AppModal } from "@/components/shared/app-modal";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { useSupportModals } from "@/contexts/support-modals-context";
import { cn } from "@/lib/utils";

type HelpFaqModalProps = {
  open: boolean;
  onClose: () => void;
};

export function HelpFaqModal({ open, onClose }: HelpFaqModalProps) {
  const { openFeedback } = useSupportModals();

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Help & FAQ"
      description="Answers to common questions about identiq."
      panelClassName="max-w-xl"
      titleId="help-faq-title"
    >
      <FaqAccordion />

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
