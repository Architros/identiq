import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildStripeSubscriptionLineItems,
  resolveStripePriceId,
} from "./stripe-line-items.js";
import type { PlanRow } from "@/lib/db/types";

describe("stripe subscription line items", () => {
  const plan: PlanRow = {
    id: "pro",
    name: "Pro",
    token_amount: 550,
    price_cents: 2900,
    currency: "usd",
    stripe_price_id: "price_monthly_recurring",
    stripe_price_id_annual: "price_yearly_recurring",
    active: true,
  };

  it("uses monthly recurring price id", () => {
    assert.equal(resolveStripePriceId(plan, "monthly"), "price_monthly_recurring");
    const items = buildStripeSubscriptionLineItems(plan, "monthly");
    assert.deepEqual(items, [{ price: "price_monthly_recurring", quantity: 1 }]);
  });

  it("uses annual recurring price id", () => {
    assert.equal(resolveStripePriceId(plan, "annual"), "price_yearly_recurring");
    const items = buildStripeSubscriptionLineItems(plan, "annual");
    assert.deepEqual(items, [{ price: "price_yearly_recurring", quantity: 1 }]);
  });

  it("throws when recurring price is missing", () => {
    assert.throws(
      () =>
        buildStripeSubscriptionLineItems(
          { ...plan, stripe_price_id: null, stripe_price_id_annual: null },
          "monthly",
        ),
      /Missing Stripe recurring price/,
    );
  });

  it("uses scale tier price for custom plan", () => {
    const custom: PlanRow = {
      id: "custom",
      name: "Scale",
      token_amount: 500,
      price_cents: 5900,
      currency: "usd",
      stripe_price_id: null,
      stripe_price_id_annual: null,
      active: true,
    };
    const items = buildStripeSubscriptionLineItems(
      custom,
      "monthly",
      "price_scale_500_monthly",
    );
    assert.deepEqual(items, [{ price: "price_scale_500_monthly", quantity: 1 }]);
  });
});
