import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveSubscriptionGrant } from "./subscription-grants.js";

describe("resolveSubscriptionGrant", () => {
  const periodEnd = new Date("2026-06-01T00:00:00Z");

  it("grants monthly tokens expiring at period end", () => {
    const g = resolveSubscriptionGrant("pro", "monthly", periodEnd);
    assert.equal(g.tokenAmount, 240);
    assert.equal(g.expiresAt.toISOString(), periodEnd.toISOString());
  });

  it("grants 12× monthly tokens for annual expiring at period end", () => {
    const g = resolveSubscriptionGrant("starter", "annual", periodEnd);
    assert.equal(g.tokenAmount, 900);
    assert.equal(g.expiresAt.toISOString(), periodEnd.toISOString());
  });
});
