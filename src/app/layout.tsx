import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { cookies } from "next/headers";
import { ConditionalAppShell } from "@/components/layout/conditional-app-shell";
import { BILLING_ACCESS_COOKIE } from "@/lib/billing/billing-access-cookie";
import { geistSans, displayFont } from "@/lib/fonts";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://app.tryidentiq.com";

const thumbnail = {
  url: "/thumbnail-larger.png",
  width: 4000,
  height: 2192,
  alt: "identiq — Generate Everything On-brand",
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "identiq — AI Brand System",
  description: "Generate cohesive brand assets with AI.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "identiq — AI Brand System",
    description: "Generate cohesive brand assets with AI.",
    type: "website",
    images: [thumbnail],
  },
  twitter: {
    card: "summary_large_image",
    title: "identiq — AI Brand System",
    description: "Generate cohesive brand assets with AI.",
    images: [thumbnail.url],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialHasBillingAccess =
    cookieStore.get(BILLING_ACCESS_COOKIE)?.value === "1" ? true : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <ConditionalAppShell initialHasBillingAccess={initialHasBillingAccess}>
          {children}
        </ConditionalAppShell>
        <Analytics />
      </body>
    </html>
  );
}
