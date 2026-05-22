export type ToastType = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  durationMs: number;
};

type Listener = () => void;

let toasts: ToastItem[] = [];
/** Stable empty snapshot for SSR / useSyncExternalStore (must not allocate per call). */
const SERVER_TOASTS: ToastItem[] = [];
const listeners = new Set<Listener>();
const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();
const recentDedupeKeys = new Map<string, number>();

/** Ignore repeat toasts with the same key within this window. */
const DEDUPE_WINDOW_MS = 8000;

const MAX_VISIBLE_TOASTS = 2;

const DEFAULT_DURATION_MS: Record<ToastType, number> = {
  error: 14_000,
  success: 5_000,
  info: 6_000,
};

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToasts(): ToastItem[] {
  return toasts;
}

export function getServerToasts(): ToastItem[] {
  return SERVER_TOASTS;
}

export function dismissToast(id: string) {
  const timer = dismissTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    dismissTimers.delete(id);
  }
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

export function stableToastId(dedupeKey: string): string {
  let hash = 0;
  for (let i = 0; i < dedupeKey.length; i++) {
    hash = (hash << 5) - hash + dedupeKey.charCodeAt(i);
    hash |= 0;
  }
  return `toast-${(hash >>> 0).toString(36)}`;
}

function shouldSkipDedupe(dedupeKey: string): boolean {
  const now = Date.now();
  const last = recentDedupeKeys.get(dedupeKey);
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) {
    return true;
  }
  recentDedupeKeys.set(dedupeKey, now);
  return false;
}

function scheduleDismiss(id: string, durationMs: number) {
  const existing = dismissTimers.get(id);
  if (existing) clearTimeout(existing);
  if (durationMs <= 0) return;
  dismissTimers.set(
    id,
    setTimeout(() => {
      dismissToast(id);
    }, durationMs),
  );
}

export function showToast(input: {
  type: ToastType;
  title?: string;
  message: string;
  durationMs?: number;
  id?: string;
  /** When set, identical keys within DEDUPE_WINDOW_MS are ignored; same id replaces in-place. */
  dedupeKey?: string;
  /** Drop other toasts of this type before showing (keeps one error visible). */
  replaceSameType?: boolean;
}): string | null {
  const dedupeKey =
    input.dedupeKey ??
    `${input.type}|${input.title ?? ""}|${input.message.trim()}`;
  if (shouldSkipDedupe(dedupeKey)) {
    return null;
  }

  const id = input.id ?? stableToastId(dedupeKey);
  const durationMs =
    input.durationMs ?? DEFAULT_DURATION_MS[input.type];

  const item: ToastItem = {
    id,
    type: input.type,
    title: input.title,
    message: input.message,
    durationMs,
  };

  let next = toasts.filter((t) => t.id !== id);
  if (input.replaceSameType) {
    next = next.filter((t) => t.type !== input.type);
  }
  toasts = [...next, item].slice(-MAX_VISIBLE_TOASTS);
  emit();
  scheduleDismiss(id, durationMs);

  return id;
}
