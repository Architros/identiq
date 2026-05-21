const SUPPORT_EMAIL = "support@identiq.app";

export type UserFacingError = {
  title: string;
  message: string;
  supportHint?: string;
};

export function supportContactLine(): string {
  return `If this keeps happening, contact us at ${SUPPORT_EMAIL}.`;
}

function collectErrorText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth++) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = current.cause;
    } else if (typeof current === "object" && current !== null) {
      const obj = current as {
        message?: string;
        code?: string;
        cause?: unknown;
      };
      if (obj.message) parts.push(obj.message);
      if (obj.code) parts.push(obj.code);
      current = obj.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(" ");
}

function matchesInfrastructurePattern(text: string): boolean {
  return /connect timeout|fetch failed|etimedout|econnreset|enotfound|eai_again|getaddrinfo|und_err_connect_timeout|service_unavailable/i.test(
    text,
  );
}

export class InfrastructureError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "InfrastructureError";
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export function isInfrastructureError(error: unknown): boolean {
  if (error instanceof InfrastructureError) return true;
  return matchesInfrastructurePattern(collectErrorText(error));
}

export function toUserFacingGenerationError(raw?: string | null): UserFacingError {
  const text = (raw ?? "").trim();
  const lower = text.toLowerCase();

  if (
    lower.includes("insufficient token") ||
    lower.includes("not enough token") ||
    lower.includes('"insufficient_tokens"')
  ) {
    return {
      title: "Not enough tokens",
      message:
        "This generation needs more tokens than you have available. Reduce presets or quantity, buy more tokens, then try again.",
    };
  }

  if (
    lower.includes("unauthorized") ||
    lower.includes("401") ||
    lower.includes("sign in")
  ) {
    return {
      title: "Session expired",
      message: "Please sign in again, then retry your generation.",
    };
  }

  if (
    matchesInfrastructurePattern(text) ||
    lower.includes("service_unavailable") ||
    lower.includes("503") ||
    lower.includes("failed to fetch")
  ) {
    return {
      title: "We couldn't reach the server",
      message:
        "Your connection or our database may be temporarily unavailable. Wait a moment and try again.",
      supportHint: supportContactLine(),
    };
  }

  if (
    lower.includes("invalid model") ||
    lower.includes("model_not_found") ||
    (lower.includes("does not exist") && lower.includes("model"))
  ) {
    return {
      title: "Image model unavailable",
      message:
        "The configured image model is not available. Check your API settings or try again later.",
      supportHint: supportContactLine(),
    };
  }

  if (
    lower.includes("content policy") ||
    lower.includes("content_policy") ||
    (lower.includes("safety") && lower.includes("violation")) ||
    lower.includes("moderation")
  ) {
    return {
      title: "Request blocked",
      message:
        "The image service declined this prompt. Try simpler wording or fewer reference images.",
    };
  }

  if (
    lower.includes("rate limit") ||
    lower.includes("429") ||
    lower.includes("overloaded")
  ) {
    return {
      title: "Service is busy",
      message:
        "The image service is temporarily overloaded. Please try again in a few minutes.",
      supportHint: supportContactLine(),
    };
  }

  if (
    lower.includes("timeout") ||
    lower.includes("aborted") ||
    lower.includes("cancel")
  ) {
    return {
      title: "Generation timed out",
      message:
        "The request took too long. Try again with fewer images or a simpler prompt.",
    };
  }

  if (text.length > 0 && text.length < 200 && !text.includes("{")) {
    return {
      title: "Generation failed",
      message: text,
      supportHint: supportContactLine(),
    };
  }

  return {
    title: "Generation failed",
    message:
      "Something went wrong while creating your image. Please try again in a moment.",
    supportHint: supportContactLine(),
  };
}

export function toUserFacingDraftSyncError(raw?: string | null): string {
  const facing = toUserFacingGenerationError(raw);
  if (isInfrastructureError({ message: raw ?? "" })) {
    return "Saved on this device only — we couldn't reach the cloud. Check your connection and try Save & exit again.";
  }
  return facing.message;
}
