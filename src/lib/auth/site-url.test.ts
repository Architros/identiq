import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getServerSiteUrl } from "./site-url.js";

describe("getServerSiteUrl", () => {
  it("falls back to localhost when NEXT_PUBLIC_SITE_URL is unset", () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    assert.equal(getServerSiteUrl(), "http://localhost:3000");
    if (prev !== undefined) process.env.NEXT_PUBLIC_SITE_URL = prev;
  });

  it("strips trailing slash from env URL", () => {
    const prev = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com/";
    assert.equal(getServerSiteUrl(), "https://example.com");
    if (prev !== undefined) process.env.NEXT_PUBLIC_SITE_URL = prev;
    else delete process.env.NEXT_PUBLIC_SITE_URL;
  });
});
