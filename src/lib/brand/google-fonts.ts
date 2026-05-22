export type GoogleFontEntry = {
  family: string;
  category: string;
  variants: string[];
};

/** Fallback when GOOGLE_FONTS_API_KEY is not configured */
export const CURATED_GOOGLE_FONTS: GoogleFontEntry[] = [
  { family: "Inter", category: "sans-serif", variants: ["400", "500", "600", "700"] },
  { family: "Roboto", category: "sans-serif", variants: ["400", "500", "700"] },
  { family: "Open Sans", category: "sans-serif", variants: ["400", "600", "700"] },
  { family: "Lato", category: "sans-serif", variants: ["400", "700"] },
  { family: "Montserrat", category: "sans-serif", variants: ["400", "500", "600", "700"] },
  { family: "Poppins", category: "sans-serif", variants: ["400", "500", "600", "700"] },
  { family: "Geist", category: "sans-serif", variants: ["400", "500", "600", "700"] },
  { family: "DM Sans", category: "sans-serif", variants: ["400", "500", "700"] },
  { family: "Work Sans", category: "sans-serif", variants: ["400", "500", "600"] },
  { family: "Nunito", category: "sans-serif", variants: ["400", "600", "700"] },
  { family: "Playfair Display", category: "serif", variants: ["400", "500", "600", "700"] },
  { family: "Merriweather", category: "serif", variants: ["400", "700"] },
  { family: "Lora", category: "serif", variants: ["400", "500", "600", "700"] },
  { family: "Varela", category: "sans-serif", variants: ["400"] },
  { family: "Libre Baskerville", category: "serif", variants: ["400", "700"] },
  { family: "Cormorant Garamond", category: "serif", variants: ["400", "500", "600"] },
  { family: "Space Grotesk", category: "sans-serif", variants: ["400", "500", "600", "700"] },
  { family: "Oswald", category: "sans-serif", variants: ["400", "500", "600", "700"] },
  { family: "Raleway", category: "sans-serif", variants: ["400", "500", "600", "700"] },
  { family: "Source Sans 3", category: "sans-serif", variants: ["400", "600", "700"] },
  { family: "JetBrains Mono", category: "monospace", variants: ["400", "500", "700"] },
  { family: "Fira Code", category: "monospace", variants: ["400", "500", "700"] },
];

export function filterFonts(
  fonts: GoogleFontEntry[],
  query: string,
): GoogleFontEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return fonts;
  return fonts.filter((f) => f.family.toLowerCase().includes(q));
}

export function googleFontsCssUrl(family: string, weights = "400;600;700"): string {
  const encoded = family.trim().replace(/\s+/g, "+");
  return `https://fonts.googleapis.com/css2?family=${encoded}:wght@${weights}&display=swap`;
}
