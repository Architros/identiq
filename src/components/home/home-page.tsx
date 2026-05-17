import { AdLibraryFeature } from "@/components/home/ad-library-feature";
import { CreateImageCard } from "@/components/home/create-image-card";
import { ActionCardsGrid } from "@/components/home/action-cards-grid";
import { DraftsSection } from "@/components/home/drafts-section";

export function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 pb-24 lg:p-8">
      <header className="space-y-1">
        <h1 className="font-display text-4xl tracking-tight text-foreground">
          Get Started
        </h1>
        <p className="text-base text-muted">
          Discover what you can create with your brand
        </p>
      </header>

      <DraftsSection />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdLibraryFeature />
        <CreateImageCard />
      </section>

      <section aria-label="Quick actions">
        <ActionCardsGrid />
      </section>
    </div>
  );
}
