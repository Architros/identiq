"use client";

import { useSyncExternalStore } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Cancel01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import {
  dismissToast,
  getServerToasts,
  getToasts,
  subscribeToasts,
  type ToastItem,
  type ToastType,
} from "@/lib/toast/toast-store";
import { cn } from "@/lib/utils";

const styles: Record<
  ToastType,
  { shell: string; icon: string; title: string; message: string }
> = {
  success: {
    shell: "border-success-border/80 bg-success-muted/90 text-success-text",
    icon: "text-success",
    title: "text-success-text",
    message: "text-success-text-subtle/90",
  },
  error: {
    shell: "border-destructive-border/80 bg-destructive-muted/90 text-destructive-text-subtle",
    icon: "text-destructive",
    title: "text-destructive-text-subtle",
    message: "text-destructive-text/90",
  },
  info: {
    shell: "border-border/80 bg-surface/90 text-foreground",
    icon: "text-muted",
    title: "text-foreground",
    message: "text-muted",
  },
};

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success") {
    return (
      <HugeiconsIcon
        icon={Tick01Icon}
        size={16}
        color="currentColor"
        strokeWidth={2}
        className={styles.success.icon}
      />
    );
  }

  return (
    <HugeiconsIcon
      icon={Alert02Icon}
      size={16}
      color="currentColor"
      strokeWidth={1.75}
      className={styles[type].icon}
    />
  );
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const variant = styles[toast.type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex w-full max-w-[min(100%,20rem)] items-start gap-2.5 rounded-lg border px-3 py-2.5 shadow-md backdrop-blur-sm",
        variant.shell,
      )}
    >
      <span className="mt-0.5 shrink-0" aria-hidden>
        <ToastIcon type={toast.type} />
      </span>
      <div className="min-w-0 flex-1">
        {toast.title ? (
          <p className={cn("text-xs font-semibold leading-snug", variant.title)}>
            {toast.title}
          </p>
        ) : null}
        <p
          className={cn(
            "text-xs leading-snug",
            toast.title ? "mt-0.5" : "",
            variant.message,
          )}
        >
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        className="mt-0.5 shrink-0 cursor-pointer rounded-md p-0.5 text-current opacity-60 transition-opacity hover:opacity-100"
        aria-label="Dismiss notification"
      >
        <HugeiconsIcon
          icon={Cancel01Icon}
          size={14}
          color="currentColor"
          strokeWidth={2}
        />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useSyncExternalStore(
    subscribeToasts,
    getToasts,
    getServerToasts,
  );

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[calc(var(--dashboard-topbar-height,3.5rem)+0.75rem)] z-[200] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
