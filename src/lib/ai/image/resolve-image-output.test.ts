import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveImageOutput } from "./resolve-image-output.js";

const MODEL = "openai/gpt-image-1";

describe("resolveImageOutput", () => {
  it("maps 1:1 at 1K to 1024x1024 medium", () => {
    const out = resolveImageOutput({
      aspectRatio: "1:1",
      resolution: "1K",
      modelId: MODEL,
    });
    assert.equal(out.size, "1024x1024");
    assert.equal(out.quality, "medium");
    assert.equal(out.displayDimensions, "1024×1024");
  });

  it("maps 2K to high quality", () => {
    const out = resolveImageOutput({
      aspectRatio: "16:9",
      resolution: "2K",
      modelId: MODEL,
    });
    assert.equal(out.size, "1536x1024");
    assert.equal(out.quality, "high");
  });

  it("uses preset aspect for instagram-story", () => {
    const out = resolveImageOutput({
      aspectRatio: "1:1",
      resolution: "2K",
      presetId: "instagram-story",
      modelId: MODEL,
    });
    assert.equal(out.aspectRatio, "9:16");
    assert.equal(out.size, "1024x1536");
  });

  it("uses preset aspect for pinterest-pin", () => {
    const out = resolveImageOutput({
      aspectRatio: "1:1",
      resolution: "1K",
      presetId: "pinterest-pin",
      modelId: MODEL,
    });
    assert.equal(out.aspectRatio, "2:3");
    assert.equal(out.size, "1024x1536");
  });

  it("uses preset aspect for linkedin-banner", () => {
    const out = resolveImageOutput({
      aspectRatio: "16:9",
      resolution: "2K",
      presetId: "linkedin-banner",
      modelId: MODEL,
    });
    assert.equal(out.aspectRatio, "21:9");
    assert.equal(out.size, "1536x1024");
    assert.ok(out.platformPixelHint?.includes("1584"));
  });
});
