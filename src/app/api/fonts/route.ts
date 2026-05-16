import { NextResponse } from "next/server";
import {
  CURATED_GOOGLE_FONTS,
  type GoogleFontEntry,
} from "@/lib/brand/google-fonts";

type GoogleApiItem = {
  family: string;
  category: string;
  variants: string[];
};

export async function GET() {
  const apiKey = process.env.GOOGLE_FONTS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ fonts: CURATED_GOOGLE_FONTS, source: "curated" });
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}&sort=popularity`,
      { next: { revalidate: 86400 } },
    );

    if (!res.ok) {
      return NextResponse.json({
        fonts: CURATED_GOOGLE_FONTS,
        source: "curated",
      });
    }

    const data = (await res.json()) as { items?: GoogleApiItem[] };
    const fonts: GoogleFontEntry[] = (data.items ?? []).map((item) => ({
      family: item.family,
      category: item.category,
      variants: item.variants ?? ["400"],
    }));

    return NextResponse.json({ fonts, source: "google" });
  } catch {
    return NextResponse.json({
      fonts: CURATED_GOOGLE_FONTS,
      source: "curated",
    });
  }
}
