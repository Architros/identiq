import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateGenerationTokenCost } from "./token-cost.js";

describe("calculateGenerationTokenCost", () => {
  it("charges 4 tokens for a single 2K preset with no references", () => {
    assert.equal(
      calculateGenerationTokenCost({
        presetCount: 1,
        hasPrompt: false,
        quantity: 1,
        resolution: "2K",
        referenceImageCount: 0,
      }),
      4,
    );
  });

  it("charges 8 tokens for 2K with two reference images", () => {
    assert.equal(
      calculateGenerationTokenCost({
        presetCount: 1,
        hasPrompt: false,
        quantity: 1,
        resolution: "2K",
        referenceImageCount: 2,
      }),
      8,
    );
  });

  it("charges 3 tokens for 1K with one reference image", () => {
    assert.equal(
      calculateGenerationTokenCost({
        presetCount: 1,
        hasPrompt: false,
        quantity: 1,
        resolution: "1K",
        referenceImageCount: 1,
      }),
      3,
    );
  });
});
