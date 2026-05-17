import type { Metadata } from "next";
import { ConditionalAppShell } from "@/components/layout/conditional-app-shell";
import { geistSans, instrumentSerif } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "identiq — AI Brand System",
  description: "Generate cohesive brand assets with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <ConditionalAppShell>{children}</ConditionalAppShell>
      </body>
    </html>
  );
}
