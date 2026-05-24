import { redirect } from "next/navigation";
import { getBillingProvider } from "@/lib/billing";
import { getAuthUser } from "@/lib/auth/session";

type PageProps = {
  searchParams: Promise<{ session?: string; retried?: string }>;
};

export default async function BillingCompletePage({ searchParams }: PageProps) {
  const { session: sessionId, retried } = await searchParams;

  if (!sessionId) {
    redirect("/billing?checkout=error&message=Missing+checkout+session");
  }

  const user = await getAuthUser();
  if (!user) {
    const next = `/billing/complete?session=${encodeURIComponent(sessionId)}`;
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  try {
    const billing = getBillingProvider();
    const { balance } = await billing.fulfillCheckout(sessionId, user.id);
    redirect(
      `/billing?checkout=success&balance=${balance}&session=${encodeURIComponent(sessionId)}`,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Checkout could not be completed";
    const retriedQuery = retried ? "&retried=1" : "";
    redirect(
      `/billing?checkout=error&message=${encodeURIComponent(message)}&session=${encodeURIComponent(sessionId)}${retriedQuery}`,
    );
  }
}
