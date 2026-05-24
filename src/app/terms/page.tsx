import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";

export const metadata: Metadata = {
  title: "Terms & Conditions — identiq",
};

export default function TermsPage() {
  return (
    <LegalDocumentPage title="Terms & Conditions">
      <p>
        By using Identiq you agree to these terms. If you do not agree, do not
        use the service.
      </p>
      <section>
        <h2 className="text-base font-semibold text-foreground">Service</h2>
        <p className="mt-2">
          Identiq provides AI-assisted brand and image tools. Features and
          availability may change. You are responsible for content you create and
          how you use generated assets.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">
          Accounts & billing
        </h2>
        <p className="mt-2">
          You must provide accurate account information. Token packs and
          subscriptions are billed as described at purchase; unused tokens may
          expire per your plan. Refunds follow our billing provider and stated
          policy at checkout.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Acceptable use</h2>
        <p className="mt-2">
          Do not misuse the service, attempt unauthorized access, or generate
          content that violates applicable law or third-party rights.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Limitation</h2>
        <p className="mt-2">
          Identiq is provided &quot;as is&quot; to the extent permitted by law.
          Our liability is limited as allowed in your jurisdiction.
        </p>
      </section>
      <p className="text-xs">Last updated: May 2026</p>
    </LegalDocumentPage>
  );
}
