import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeCustomPack } from "./custom-pack-pricing.js";
import { resolveCheckoutPack } from "./resolve-checkout.js";
import { resolvePack } from "./plan-catalog.js";

describe("resolvePack", () => {
  it("resolves monthly starter/pro/studio at catalog prices", () => {
    assert.deepEqual(resolvePack("starter", "monthly"), {
      planId: "starter",
      name: "Starter",
      tokenAmount: 120,
      amountCents: 700,
      interval: "monthly",
    });
    assert.deepEqual(resolvePack("pro", "monthly"), {
      planId: "pro",
      name: "Pro",
      tokenAmount: 550,
      amountCents: 2900,
      interval: "monthly",
    });
    assert.deepEqual(resolvePack("studio", "monthly"), {
      planId: "studio",
      name: "Studio",
      tokenAmount: 1100,
      amountCents: 4900,
      interval: "monthly",
    });
  });

  it("resolves annual packs as 12× tokens at 10× monthly price", () => {
    assert.deepEqual(resolvePack("starter", "annual"), {
      planId: "starter",
      name: "Starter",
      tokenAmount: 1440,
      amountCents: 7000,
      interval: "annual",
    });
    assert.deepEqual(resolvePack("pro", "annual"), {
      planId: "pro",
      name: "Pro",
      tokenAmount: 6600,
      amountCents: 29000,
      interval: "annual",
    });
  });

  it("resolves welcome as fixed one-time pack", () => {
    assert.deepEqual(resolvePack("welcome", "monthly"), {
      planId: "welcome",
      name: "Welcome offer",
      tokenAmount: 80,
      amountCents: 500,
      interval: "monthly",
    });
  });

  it("rejects welcome on annual interval", () => {
    assert.throws(
      () => resolvePack("welcome", "annual"),
      /one-time only/,
    );
  });
});

describe("computeCustomPack", () => {
  it("charges 5¢/token with $15 minimum monthly", () => {
    assert.deepEqual(computeCustomPack(200, "monthly"), {
      tokenAmount: 200,
      amountCents: 1500,
    });
    assert.deepEqual(computeCustomPack(500, "monthly"), {
      tokenAmount: 500,
      amountCents: 2500,
    });
  });

  it("annual custom grants 12× slider tokens at 10× monthly charge", () => {
    assert.deepEqual(computeCustomPack(500, "annual"), {
      tokenAmount: 6000,
      amountCents: 25000,
    });
  });

  it("rejects out-of-range token amounts", () => {
    assert.throws(() => computeCustomPack(199, "monthly"), /between/);
    assert.throws(() => computeCustomPack(5001, "monthly"), /between/);
  });
});

describe("resolveCheckoutPack", () => {
  it("routes custom and welcome through catalog helpers", () => {
    assert.equal(
      resolveCheckoutPack({
        planId: "custom",
        interval: "monthly",
        customTokenAmount: 1000,
      }).amountCents,
      5000,
    );
    assert.throws(
      () =>
        resolveCheckoutPack({
          planId: "custom",
          interval: "monthly",
        }),
      /customTokenAmount/,
    );
  });
});
