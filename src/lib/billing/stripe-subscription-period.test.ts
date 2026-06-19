import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type Stripe from "stripe";
import {
  isValidDate,
  periodEndFromStripeSubscription,
} from "@/lib/billing/stripe-subscription-period";

describe("periodEndFromStripeSubscription", () => {
  it("reads current_period_end from subscription items (Basil API)", () => {
    const unix = Math.floor(new Date("2026-06-01T00:00:00Z").getTime() / 1000);
    const sub = {
      items: {
        data: [{ current_period_end: unix }],
      },
    } as Stripe.Subscription;

    const end = periodEndFromStripeSubscription(sub, "monthly");
    assert.equal(end.toISOString(), new Date(unix * 1000).toISOString());
  });

  it("falls back to legacy subscription current_period_end", () => {
    const unix = Math.floor(new Date("2026-07-01T00:00:00Z").getTime() / 1000);
    const sub = {
      items: { data: [] },
      current_period_end: unix,
    } as unknown as Stripe.Subscription & { current_period_end: number };

    const end = periodEndFromStripeSubscription(sub, "monthly");
    assert.equal(end.toISOString(), new Date(unix * 1000).toISOString());
  });

  it("uses default period when Stripe sends no period fields", () => {
    const sub = { items: { data: [{}] } } as Stripe.Subscription;
    const before = Date.now();
    const end = periodEndFromStripeSubscription(sub, "monthly");
    assert.ok(isValidDate(end));
    assert.ok(end.getTime() > before);
  });
});

describe("isValidDate", () => {
  it("rejects invalid dates", () => {
    assert.equal(isValidDate(new Date("invalid")), false);
    assert.equal(isValidDate(new Date()), true);
  });
});
