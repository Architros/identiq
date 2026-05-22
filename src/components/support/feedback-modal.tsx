"use client";

import { useState } from "react";
import { AppModal } from "@/components/shared/app-modal";
import { showErrorToast, showSuccessToast } from "@/lib/toast/show-toast";

type FeedbackModalProps = {
  open: boolean;
  onClose: () => void;
};

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      showErrorToast("Please enter your feedback before sending.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ message: trimmed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Could not send feedback");
      }
      showSuccessToast("Thanks — we received your feedback.");
      setMessage("");
      onClose();
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "Could not send feedback",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title="Feedback"
      description="Tell us what’s working, what’s confusing, or what you’d like next."
      panelClassName="max-w-lg"
      titleId="feedback-modal-title"
    >
      <label className="block">
        <span className="text-sm font-medium text-foreground">Your message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Share your thoughts…"
          className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        />
      </label>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleClose}
          disabled={submitting}
          className="cursor-pointer rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-sidebar-active disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className="cursor-pointer rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send feedback"}
        </button>
      </div>
    </AppModal>
  );
}
