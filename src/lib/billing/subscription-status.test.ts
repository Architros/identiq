import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSubscriptionExpired,
  isSubscriptionStatusActive,
  normalizeSubscriptionPlanId,
  resolveDisplayStatus,
} from "./subscription-status.js";

describe("normalizeSubscriptionPlanId", () => {
  it("ignores legacy free plan", () => {
    assert.equal(normalizeSubscriptionPlanId(null, "free"), null);
    assert.equal(normalizeSubscriptionPlanId("pro", "free"), "pro");
  });
});

describe("resolveDisplayStatus", () => {
  it("marks past period end as expired", () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    assert.equal(
      resolveDisplayStatus({
        planId: "pro",
        status: "active",
        currentPeriodEnd: past,
      }),
      "expired",
    );
  });

  it("marks welcome as one_time", () => {
    assert.equal(
      resolveDisplayStatus({
        planId: "welcome",
        status: "active",
        currentPeriodEnd: null,
      }),
      "one_time",
    );
  });

  it("shows past_due instead of active", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    assert.equal(
      resolveDisplayStatus({
        planId: "pro",
        status: "past_due",
        currentPeriodEnd: future,
      }),
      "past_due",
    );
  });

  it("treats active without period end as expired for recurring plans", () => {
    assert.equal(
      resolveDisplayStatus({
        planId: "pro",
        status: "active",
        currentPeriodEnd: null,
      }),
      "expired",
    );
  });
});

describe("isSubscriptionStatusActive", () => {
  it("requires future period end when set", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    assert.equal(isSubscriptionStatusActive("active", future), true);
    const past = new Date(Date.now() - 86_400_000).toISOString();
    assert.equal(isSubscriptionStatusActive("active", past), false);
  });
});

describe("isSubscriptionExpired", () => {
  it("detects past period end", () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    assert.equal(isSubscriptionExpired("active", past), true);
  });
});
