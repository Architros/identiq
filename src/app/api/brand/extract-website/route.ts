import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/with-auth";

const MAX_HTML_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 10_000;
const SUMMARY_CHAR_LIMIT = 1200;

const bodySchema = z.object({
  domain: z.string().min(1),
});

function normalizeWebsiteUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Enter a website URL.");
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (!url.hostname.includes(".")) {
    throw new Error("Enter a valid website domain.");
  }
  return `${url.protocol}//${url.host}${url.pathname}${url.search}`;
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function textFromHtml(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return collapseWhitespace(decodeBasicEntities(stripped));
}

function readMetaContent(html: string, key: string): string {
  const patterns = [
    new RegExp(
      `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern)?.[1];
    if (match) return collapseWhitespace(decodeBasicEntities(match));
  }
  return "";
}

function readTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  return collapseWhitespace(decodeBasicEntities(match));
}

function summarizeWebsiteText(input: {
  title: string;
  metaDescription: string;
  text: string;
}): string {
  const parts: string[] = [];
  if (input.title) parts.push(`Title: ${input.title}`);
  if (input.metaDescription) parts.push(`Meta description: ${input.metaDescription}`);

  const snippet = input.text.slice(0, SUMMARY_CHAR_LIMIT);
  if (snippet) parts.push(`Page content: ${snippet}`);

  return collapseWhitespace(parts.join("\n"));
}

export async function POST(request: Request) {
  return withAuth(null, async () => {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Domain is required." }, { status: 400 });
    }

    let sourceUrl = "";
    try {
      sourceUrl = normalizeWebsiteUrl(parsed.data.domain);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid website URL." },
        { status: 400 },
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(sourceUrl, {
        signal: controller.signal,
        redirect: "follow",
        cache: "no-store",
        headers: {
          "user-agent": "IdentiqBot/1.0 (+https://tryidentiq.com)",
          accept: "text/html,application/xhtml+xml",
        },
      });
    } catch {
      clearTimeout(timer);
      return NextResponse.json(
        { error: "Could not reach that website. Check the URL and try again." },
        { status: 422 },
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `Website returned ${response.status}. Try another page.` },
        { status: 422 },
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      return NextResponse.json(
        { error: "This URL is not an HTML page. Please use a website page URL." },
        { status: 422 },
      );
    }

    const html = await response.text();
    if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) {
      return NextResponse.json(
        { error: "Website is too large to analyze. Try a simpler page URL." },
        { status: 422 },
      );
    }

    const title = readTitle(html);
    const metaDescription =
      readMetaContent(html, "description") ||
      readMetaContent(html, "og:description");
    const text = textFromHtml(html);
    const summary = summarizeWebsiteText({ title, metaDescription, text });

    if (!summary) {
      return NextResponse.json(
        { error: "We could not extract useful text from this website." },
        { status: 422 },
      );
    }

    return NextResponse.json({
      sourceUrl,
      title,
      metaDescription,
      summary,
      fetchedAt: new Date().toISOString(),
    });
  });
}
