import Link from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";

type LegalDocumentPageProps = {
  title: string;
  children: React.ReactNode;
};

export function LegalDocumentPage({ title, children }: LegalDocumentPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="shrink-0 border-b border-border bg-surface px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="font-display text-lg tracking-tight text-foreground"
        >
          identiq
        </Link>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-display text-2xl tracking-tight text-foreground">
          {title}
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
