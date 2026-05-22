import { Geist, Varela } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const displayFont = Varela({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});
