import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  deriveChatTitle,
  isMeaningfulChatHistory,
} from "./chat-history.js";
import type { IdentiqUIMessage } from "./chat-message-types.js";

function userMsg(text: string, presetTitles?: string[]): IdentiqUIMessage {
  return {
    id: "u1",
    role: "user",
    parts: [{ type: "text", text }],
    metadata: presetTitles ? { presetTitles } : undefined,
  };
}

function assistantText(text: string): IdentiqUIMessage {
  return {
    id: "a1",
    role: "assistant",
    parts: [{ type: "text", text }],
  };
}

describe("isMeaningfulChatHistory", () => {
  it("rejects empty and user-only threads", () => {
    assert.equal(isMeaningfulChatHistory([]), false);
    assert.equal(isMeaningfulChatHistory([userMsg("Hello")]), false);
  });

  it("accepts threads with assistant output", () => {
    assert.equal(
      isMeaningfulChatHistory([userMsg("Hi"), assistantText("Done")]),
      true,
    );
    assert.equal(
      isMeaningfulChatHistory([
        userMsg(" "),
        {
          id: "a2",
          role: "assistant",
          parts: [{ type: "data-image-result", data: {} as never }],
        },
      ]),
      true,
    );
  });
});

describe("deriveChatTitle", () => {
  it("uses prompt text when title is default", () => {
    assert.equal(
      deriveChatTitle([userMsg("Summer sale banner")], "New chat"),
      "Summer sale banner",
    );
  });

  it("falls back to preset titles", () => {
    assert.equal(
      deriveChatTitle(
        [userMsg(" ", ["LinkedIn Post", "Instagram Story"])],
        "New chat",
      ),
      "LinkedIn Post · Instagram Story",
    );
  });
});
