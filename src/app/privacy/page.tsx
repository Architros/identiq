import type { Metadata } from "next";
import { LegalDocumentPage } from "@/components/legal/legal-document-page";

export const metadata: Metadata = {
  title: "Privacy Policy — identiq",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage title="Privacy Policy">
      <p>
        Identiq (&quot;we&quot;, &quot;us&quot;) respects your privacy. This
        policy describes what we collect, how we use it, and your choices.
      </p>
      <section>
        <h2 className="text-base font-semibold text-foreground">
          Information we collect
        </h2>
        <p className="mt-2">
          We collect account details (such as email), brand and asset content you
          upload, usage data needed to run the service, and billing information
          processed by our payment provider.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">
          How we use information
        </h2>
        <p className="mt-2">
          We use your information to provide and improve Identiq, process
          payments, secure the platform, and communicate with you about your
          account.
        </p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-foreground">Contact</h2>
        <p className="mt-2">
          Questions about privacy? Contact us through the in-app support option
          or your account email channel.
        </p>
      </section>
      <p className="text-xs">Last updated: May 2026</p>
    </LegalDocumentPage>
  );
}
