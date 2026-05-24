import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emailSchema,
  mapOtpSendError,
  normalizeEmail,
  otpTokenSchema,
} from "./email-otp.js";

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    assert.equal(normalizeEmail("  User@Example.COM  "), "user@example.com");
  });
});

describe("emailSchema", () => {
  it("accepts valid emails", () => {
    assert.equal(emailSchema.parse("a@b.co"), "a@b.co");
  });

  it("rejects invalid emails", () => {
    assert.throws(() => emailSchema.parse("not-an-email"));
    assert.throws(() => emailSchema.parse(""));
  });
});

describe("otpTokenSchema", () => {
  it("accepts 6-digit codes", () => {
    assert.equal(otpTokenSchema.parse("123456"), "123456");
  });

  it("rejects non-numeric or wrong length", () => {
    assert.throws(() => otpTokenSchema.parse("12345"));
    assert.throws(() => otpTokenSchema.parse("abcdef"));
  });
});

describe("mapOtpSendError", () => {
  it("maps rate limit messages to 429", () => {
    const result = mapOtpSendError("Email rate limit exceeded");
    assert.equal(result.status, 429);
  });
});
