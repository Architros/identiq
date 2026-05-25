import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPasswordRequirementStatus,
  passwordSchema,
  setPasswordFormSchema,
  userMustSetPassword,
  userNeedsPasswordSetup,
} from "./password.js";

describe("userNeedsPasswordSetup", () => {
  it("requires setup when flag is missing or false", () => {
    assert.equal(userNeedsPasswordSetup(undefined), true);
    assert.equal(userNeedsPasswordSetup({}), true);
    assert.equal(userNeedsPasswordSetup({ password_configured: false }), true);
  });

  it("skips when password_configured is true", () => {
    assert.equal(
      userNeedsPasswordSetup({ password_configured: true }),
      false,
    );
  });
});

describe("passwordSchema", () => {
  it("rejects passwords shorter than minimum", () => {
    assert.throws(() => passwordSchema.parse("12345"));
  });

  it("accepts valid passwords", () => {
    assert.equal(passwordSchema.parse("secret12"), "secret12");
  });
});

describe("userMustSetPassword", () => {
  it("requires password for email identity without flag", () => {
    assert.equal(
      userMustSetPassword({
        identities: [{ provider: "email" }],
      }),
      true,
    );
  });

  it("skips OAuth-only users", () => {
    assert.equal(
      userMustSetPassword({
        identities: [{ provider: "google" }],
      }),
      false,
    );
  });

  it("skips when password already configured", () => {
    assert.equal(
      userMustSetPassword({
        user_metadata: { password_configured: true },
        identities: [{ provider: "email" }],
      }),
      false,
    );
  });
});

describe("getPasswordRequirementStatus", () => {
  it("marks min length when password is long enough", () => {
    const status = getPasswordRequirementStatus("secret12", "");
    assert.equal(status.min_length, true);
    assert.equal(status.passwords_match, false);
  });

  it("marks match when confirm equals password", () => {
    const status = getPasswordRequirementStatus("secret12", "secret12");
    assert.equal(status.passwords_match, true);
  });
});

describe("setPasswordFormSchema", () => {
  it("rejects mismatched confirmation", () => {
    const result = setPasswordFormSchema.safeParse({
      password: "secret12",
      confirmPassword: "secret99",
    });
    assert.equal(result.success, false);
  });

  it("accepts matching passwords", () => {
    const result = setPasswordFormSchema.safeParse({
      password: "secret12",
      confirmPassword: "secret12",
    });
    assert.equal(result.success, true);
  });
});
