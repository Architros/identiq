import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeCustomPack } from "./custom-pack-pricing.js";
import { resolveCheckoutPack } from "./resolve-checkout.js";
import { resolvePack } from "./plan-catalog.js";
import {
  DEFAULT_FREE_ASSET_STORAGE_LIMIT,
  mergeStorageLimits,
  monthlyTokenBasisFromGrantedCustomTokens,
  PACK_STORED_ASSET_LIMITS,
  resolveCustomPackStorageLimit,
  resolveStorageLimitForPlan,
} from "./storage-entitlement.js";

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
  it("uses tier pricing starting at $39 for 300 tokens monthly", () => {
    assert.deepEqual(computeCustomPack(300, "monthly"), {
      tokenAmount: 300,
      amountCents: 3900,
    });
    assert.deepEqual(computeCustomPack(500, "monthly"), {
      tokenAmount: 500,
      amountCents: 5900,
    });
    assert.deepEqual(computeCustomPack(1000, "monthly"), {
      tokenAmount: 1000,
      amountCents: 9900,
    });
  });

  it("annual custom grants 12× tier tokens at 10× monthly charge", () => {
    assert.deepEqual(computeCustomPack(500, "annual"), {
      tokenAmount: 6000,
      amountCents: 59000,
    });
    assert.deepEqual(computeCustomPack(300, "annual"), {
      tokenAmount: 3600,
      amountCents: 39000,
    });
  });

  it("rejects non-tier token amounts", () => {
    assert.throws(() => computeCustomPack(199, "monthly"), /one of:/);
    assert.throws(() => computeCustomPack(750, "monthly"), /one of:/);
    assert.throws(() => computeCustomPack(5001, "monthly"), /one of:/);
  });
});

describe("storage entitlements", () => {
  it("assigns Bloom-style stored asset limits per pack", () => {
    assert.equal(DEFAULT_FREE_ASSET_STORAGE_LIMIT, 25);
    assert.equal(resolveStorageLimitForPlan("welcome"), 50);
    assert.equal(resolveStorageLimitForPlan("starter"), 150);
    assert.equal(resolveStorageLimitForPlan("pro"), 500);
    assert.equal(resolveStorageLimitForPlan("studio"), 2000);
  });

  it("tiers custom packs by monthly token slider", () => {
    assert.equal(resolveCustomPackStorageLimit(300), PACK_STORED_ASSET_LIMITS.starter);
    assert.equal(resolveCustomPackStorageLimit(500), PACK_STORED_ASSET_LIMITS.pro);
    assert.equal(resolveCustomPackStorageLimit(1000), PACK_STORED_ASSET_LIMITS.studio);
  });

  it("infers monthly basis from annual custom grants", () => {
    assert.equal(monthlyTokenBasisFromGrantedCustomTokens(6000), 500);
    assert.equal(
      resolveStorageLimitForPlan("custom", { customMonthlyTokenBasis: 500 }),
      500,
    );
  });

  it("merges storage limits upward only", () => {
    assert.equal(mergeStorageLimits(150, 500), 500);
    assert.equal(mergeStorageLimits(500, 150), 500);
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
      9900,
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
