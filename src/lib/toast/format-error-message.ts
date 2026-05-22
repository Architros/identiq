import { supportContactLine } from "@/lib/errors/user-facing";

const SUPPORT_SNIPPET = "support@identiq.app";

/** Avoid repeating the support line when the server or mapper already included it. */
export function appendSupportHintOnce(
  message: string,
  supportHint?: string,
): string {
  if (!supportHint?.trim()) return message.trim();
  const lower = message.toLowerCase();
  if (
    lower.includes(SUPPORT_SNIPPET) ||
    lower.includes("if this keeps happening")
  ) {
    return message.trim();
  }
  return `${message.trim()} ${supportHint.trim()}`;
}

/** Strip a leading `Title: body` prefix so we do not re-map an already formatted error. */
export function stripErrorTitlePrefix(raw: string): string {
  const trimmed = raw.trim();
  const match = /^([^:]{1,80}):\s+([\s\S]+)$/.exec(trimmed);
  if (!match) return trimmed;
  const title = match[1].trim().toLowerCase();
  const body = match[2].trim();
  const genericTitles = new Set([
    "generation failed",
    "not enough tokens",
    "session expired",
    "we couldn't reach the server",
    "image model unavailable",
    "request blocked",
    "service is busy",
    "generation timed out",
  ]);
  if (genericTitles.has(title)) return body;
  return trimmed;
}
