import { toUserFacingGenerationError } from "@/lib/errors/user-facing";
import {
  appendSupportHintOnce,
  stripErrorTitlePrefix,
} from "@/lib/toast/format-error-message";
import { dismissToast, showToast } from "@/lib/toast/toast-store";

export function showErrorToast(
  raw: string,
  options?: {
    title?: string;
    durationMs?: number;
    dedupeKey?: string;
    /** Skip generation-specific error mapping for general app errors. */
    mapAsGeneration?: boolean;
    /** Replace any visible error toasts (e.g. one generation failure at a time). */
    replaceErrors?: boolean;
  },
) {
  const cleaned = stripErrorTitlePrefix(raw);
  const mapAsGeneration = options?.mapAsGeneration ?? true;
  const facing = mapAsGeneration
    ? toUserFacingGenerationError(cleaned)
    : null;
  const fallbackMessage = cleaned || "Something went wrong. Please try again.";
  const message = facing
    ? appendSupportHintOnce(facing.message, facing.supportHint)
    : fallbackMessage;
  const title = options?.title ?? facing?.title ?? "Error";
  const dedupeKey = options?.dedupeKey ?? `error|${title}|${message}`;
  return showToast({
    type: "error",
    title,
    message,
    durationMs: options?.durationMs,
    dedupeKey,
    replaceSameType: options?.replaceErrors,
  });
}

export function showSuccessToast(
  message: string,
  options?: { title?: string; durationMs?: number; dedupeKey?: string },
) {
  const dedupeKey =
    options?.dedupeKey ?? `success|${options?.title ?? "Success"}|${message}`;
  return showToast({
    type: "success",
    title: options?.title ?? "Success",
    message,
    durationMs: options?.durationMs,
    dedupeKey,
  });
}

export function showInfoToast(
  message: string,
  options?: { title?: string; durationMs?: number; dedupeKey?: string },
) {
  const dedupeKey =
    options?.dedupeKey ?? `info|${options?.title ?? ""}|${message}`;
  return showToast({
    type: "info",
    title: options?.title,
    message,
    durationMs: options?.durationMs,
    dedupeKey,
  });
}

export { dismissToast };
