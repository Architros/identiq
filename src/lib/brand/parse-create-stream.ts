import type {
  AssetCompleteData,
  AssetProgressData,
  CreateCompleteData,
  CreateStatusData,
} from "@/lib/brand/create-stream-types";

export type CreateStreamEvent =
  | { type: "create-status"; data: CreateStatusData }
  | { type: "asset-progress"; data: AssetProgressData }
  | { type: "asset-complete"; data: AssetCompleteData }
  | { type: "create-complete"; data: CreateCompleteData }
  | { type: "error"; errorText: string };

function parseSseChunk(chunk: string): CreateStreamEvent[] {
  const events: CreateStreamEvent[] = [];
  const lines = chunk.split("\n");

  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const payload = line.slice(6).trim();
    if (!payload || payload === "[DONE]") continue;

    try {
      const parsed = JSON.parse(payload) as {
        type?: string;
        data?: unknown;
        errorText?: string;
      };

      if (parsed.type === "error" && parsed.errorText) {
        events.push({ type: "error", errorText: parsed.errorText });
        continue;
      }

      if (parsed.type?.startsWith("data-") && parsed.data) {
        const key = parsed.type.replace("data-", "");
        if (key === "create-status") {
          events.push({
            type: "create-status",
            data: parsed.data as CreateStatusData,
          });
        } else if (key === "asset-progress") {
          events.push({
            type: "asset-progress",
            data: parsed.data as AssetProgressData,
          });
        } else if (key === "asset-complete") {
          events.push({
            type: "asset-complete",
            data: parsed.data as AssetCompleteData,
          });
        } else if (key === "create-complete") {
          events.push({
            type: "create-complete",
            data: parsed.data as CreateCompleteData,
          });
        }
      }
    } catch {
      // ignore partial JSON
    }
  }

  return events;
}

export async function consumeBrandCreateStream(
  input: Record<string, unknown>,
  onEvent: (event: CreateStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch("/api/brand/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? "Brand creation failed",
    );
  }

  if (!response.body) {
    throw new Error("Empty response stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      for (const event of parseSseChunk(part)) {
        onEvent(event);
      }
    }
  }

  if (buffer.trim()) {
    for (const event of parseSseChunk(buffer)) {
      onEvent(event);
    }
  }
}
