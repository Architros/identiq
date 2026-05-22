import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api/with-auth";
import { isAllowedAssetUrl } from "@/lib/download/allowed-asset-url";

export async function GET(request: Request) {
  return withAuth(null, async () => {
    const url = new URL(request.url).searchParams.get("url")?.trim();
    if (!url || !isAllowedAssetUrl(url)) {
      return NextResponse.json({ error: "Invalid asset URL" }, { status: 400 });
    }

    let upstream: Response;
    try {
      upstream = await fetch(url, { cache: "no-store" });
    } catch {
      return NextResponse.json(
        { error: "Could not reach asset storage" },
        { status: 502 },
      );
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Asset unavailable (${upstream.status})` },
        { status: upstream.status === 404 ? 404 : 502 },
      );
    }

    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  });
}
