import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSubscriptionSummaryFromSnapshots } from "./subscription-resolve.js";

const names = new Map([
  ["welcome", "Welcome offer"],
  ["studio", "Studio"],
  ["pro", "Pro"],
]);

describe("resolveSubscriptionSummaryFromSnapshots", () => {
  it("prefers welcome one-time over orphan studio subscription row", () => {
    const summary = resolveSubscriptionSummaryFromSnapshots({
      checkout: {
        planId: "welcome",
        billingInterval: "monthly",
        completedAt: "2026-05-01T12:00:00.000Z",
        simulated: true,
      },
      subscription: {
        planId: "studio",
        legacyPlan: "studio",
        billingInterval: "monthly",
        status: "active",
        currentPeriodEnd: "2026-06-24T11:34:00.000Z",
        stripeSubscriptionId: null,
      },
      billingMode: "simulated",
      planNames: names,
    });

    assert.equal(summary?.planName, "Welcome offer");
    assert.equal(summary?.displayStatus, "one_time");
    assert.equal(summary?.isRecurringActive, false);
  });

  it("shows simulated recurring when checkout matches subscription row", () => {
    const summary = resolveSubscriptionSummaryFromSnapshots({
      checkout: {
        planId: "studio",
        billingInterval: "monthly",
        completedAt: "2026-05-01T12:00:00.000Z",
        simulated: true,
      },
      subscription: {
        planId: "studio",
        legacyPlan: "studio",
        billingInterval: "monthly",
        status: "active",
        currentPeriodEnd: "2026-06-24T11:34:00.000Z",
        stripeSubscriptionId: null,
      },
      billingMode: "simulated",
      planNames: names,
    });

    assert.equal(summary?.planName, "Studio");
    assert.equal(summary?.displayStatus, "active");
    assert.equal(summary?.isSimulated, true);
  });

  it("does not show active recurring when checkout and subscription disagree", () => {
    const summary = resolveSubscriptionSummaryFromSnapshots({
      checkout: {
        planId: "pro",
        billingInterval: "monthly",
        completedAt: "2026-05-01T12:00:00.000Z",
        simulated: true,
      },
      subscription: {
        planId: "studio",
        legacyPlan: "studio",
        billingInterval: "monthly",
        status: "active",
        currentPeriodEnd: "2026-06-24T11:34:00.000Z",
        stripeSubscriptionId: null,
      },
      billingMode: "simulated",
      planNames: names,
    });

    assert.equal(summary?.planName, "Pro");
    assert.equal(summary?.displayStatus, "expired");
    assert.equal(summary?.isRecurringActive, false);
    assert.ok(summary?.syncNote);
  });

  it("trusts stripe-backed subscription row", () => {
    const summary = resolveSubscriptionSummaryFromSnapshots({
      checkout: {
        planId: "welcome",
        billingInterval: "monthly",
        completedAt: "2026-05-01T12:00:00.000Z",
        simulated: false,
      },
      subscription: {
        planId: "studio",
        legacyPlan: "studio",
        billingInterval: "monthly",
        status: "active",
        currentPeriodEnd: "2026-06-24T11:34:00.000Z",
        stripeSubscriptionId: "sub_123",
      },
      billingMode: "stripe",
      planNames: names,
    });

    assert.equal(summary?.planName, "Studio");
    assert.equal(summary?.displayStatus, "active");
    assert.equal(summary?.isSimulated, false);
  });
});
