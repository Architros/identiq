import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { cookies } from "next/headers";
import { ConditionalAppShell } from "@/components/layout/conditional-app-shell";
import { BILLING_ACCESS_COOKIE } from "@/lib/billing/billing-access-cookie";
import { geistSans, displayFont } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "identiq — AI Brand System",
  description: "Generate cohesive brand assets with AI.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
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
