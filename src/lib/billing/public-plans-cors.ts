import { NextResponse } from "next/server";

const DEFAULT_LANDING_ORIGINS = [
  "https://tryidentiq.com",
  "https://www.tryidentiq.com",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

function allowedOrigins(): string[] {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const origins = [...DEFAULT_LANDING_ORIGINS];
  if (fromEnv) {
    origins.push(fromEnv.replace(/\/$/, ""));
  }
  return [...new Set(origins)];
}

export function withPublicPlansCors(
  request: Request,
  response: NextResponse,
): NextResponse {
  const origin = request.headers.get("origin");
  if (!origin) return response;

  const allowed = allowedOrigins();
  if (!allowed.includes(origin)) return response;

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Vary", "Origin");
  return response;
}

export function publicPlansPreflightResponse(request: Request): NextResponse | null {
  if (request.method !== "OPTIONS") return null;
  const origin = request.headers.get("origin");
  const allowed = allowedOrigins();
  if (!origin || !allowed.includes(origin)) {
    return new NextResponse(null, { status: 204 });
  }
  const res = new NextResponse(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  res.headers.set("Vary", "Origin");
  return res;
}
