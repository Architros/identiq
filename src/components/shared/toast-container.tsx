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

    shell: "border-emerald-200/80 bg-emerald-50/90 text-emerald-950",

    icon: "text-emerald-600",

    title: "text-emerald-950",

    message: "text-emerald-800/90",

  },

  error: {

    shell: "border-red-200/80 bg-red-50/90 text-red-950",

    icon: "text-red-600",

    title: "text-red-950",

    message: "text-red-800/90",

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

  const toasts = useSyncExternalStore(subscribeToasts, getToasts, () => []);



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


