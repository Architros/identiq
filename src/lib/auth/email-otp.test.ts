import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  emailSchema,
  mapOtpSendError,
  normalizeEmail,
  otpTokenSchema,
} from "./email-otp.js";

const TEMPLATE_DIR = path.join(
  process.cwd(),
  "docs/supabase-email-templates",
);

describe("supabase auth email templates", () => {
  for (const file of [
    "magic-link.html",
    "confirm-signup.html",
    "recovery.html",
  ]) {
    it(`${file} is OTP-only (Token, no ConfirmationURL)`, () => {
      const content = fs.readFileSync(path.join(TEMPLATE_DIR, file), "utf8");
      assert.match(content, /\{\{\s*\.Token\s*\}\}/);
      assert.doesNotMatch(content, /ConfirmationURL/);
    });
  }
});

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
