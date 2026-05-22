import { toUserFacingGenerationError } from "@/lib/errors/user-facing";
import { stripErrorTitlePrefix } from "@/lib/toast/format-error-message";

/** Short copy for inline chat errors (no title prefix, no support paragraph). */
export function formatInlineGenerationError(raw?: string | null): string {
  const cleaned = stripErrorTitlePrefix(raw?.trim() ?? "");
  if (!cleaned) {
    return "Something went wrong while creating your image. Please try again.";
  }
  return toUserFacingGenerationError(cleaned).message;
}
