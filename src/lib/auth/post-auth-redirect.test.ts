import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DASHBOARD_PATH,
  SUBSCRIPTION_PATH,
  isBillingOnboardingPath,
  resolveDestinationPath,
  sanitizeNextPath,
} from "./post-auth-destination.js";

describe("sanitizeNextPath", () => {
  it("defaults to dashboard", () => {
    assert.equal(sanitizeNextPath(null), DASHBOARD_PATH);
    assert.equal(sanitizeNextPath(undefined), DASHBOARD_PATH);
  });

  it("preserves valid deep links", () => {
    assert.equal(sanitizeNextPath("/library"), "/library");
  });
});

describe("resolveDestinationPath", () => {
  it("sends new users to subscriptions", () => {
    assert.equal(resolveDestinationPath(false, "/"), SUBSCRIPTION_PATH);
    assert.equal(resolveDestinationPath(false, null), SUBSCRIPTION_PATH);
  });

  it("sends subscribers to dashboard by default", () => {
    assert.equal(resolveDestinationPath(true, null), DASHBOARD_PATH);
    assert.equal(resolveDestinationPath(true, "/billing"), DASHBOARD_PATH);
  });

  it("honors deep links for subscribers", () => {
    assert.equal(resolveDestinationPath(true, "/library"), "/library");
  });
});

describe("isBillingOnboardingPath", () => {
  it("matches billing routes only", () => {
    assert.equal(isBillingOnboardingPath("/billing"), true);
    assert.equal(isBillingOnboardingPath("/billing?required=1"), true);
    assert.equal(isBillingOnboardingPath("/library"), false);
  });
});
