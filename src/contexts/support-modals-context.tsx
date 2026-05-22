"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { FeedbackModal } from "@/components/support/feedback-modal";
import { HelpFaqModal } from "@/components/support/help-faq-modal";

type SupportModalsContextValue = {
  helpOpen: boolean;
  feedbackOpen: boolean;
  openHelp: () => void;
  openFeedback: () => void;
  closeHelp: () => void;
  closeFeedback: () => void;
};

const SupportModalsContext = createContext<SupportModalsContextValue | null>(
  null,
);

export function SupportModalsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const openHelp = useCallback(() => {
    setFeedbackOpen(false);
    setHelpOpen(true);
  }, []);

  const openFeedback = useCallback(() => {
    setHelpOpen(false);
    setFeedbackOpen(true);
  }, []);

  const closeHelp = useCallback(() => setHelpOpen(false), []);
  const closeFeedback = useCallback(() => setFeedbackOpen(false), []);

  const value = useMemo(
    () => ({
      helpOpen,
      feedbackOpen,
      openHelp,
      openFeedback,
      closeHelp,
      closeFeedback,
    }),
    [
      helpOpen,
      feedbackOpen,
      openHelp,
      openFeedback,
      closeHelp,
      closeFeedback,
    ],
  );

  return (
    <SupportModalsContext.Provider value={value}>
      {children}
      <HelpFaqModal open={helpOpen} onClose={closeHelp} />
      <FeedbackModal open={feedbackOpen} onClose={closeFeedback} />
    </SupportModalsContext.Provider>
  );
}

export function useSupportModals() {
  const ctx = useContext(SupportModalsContext);
  if (!ctx) {
    throw new Error(
      "useSupportModals must be used within SupportModalsProvider",
    );
  }
  return ctx;
}

export function useSupportModalsOptional() {
  return useContext(SupportModalsContext);
}
