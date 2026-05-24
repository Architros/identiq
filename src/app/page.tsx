import { HomePage } from "@/components/home/home-page";
import { requirePageSession } from "@/lib/auth/require-page-session";

export default async function RootPage() {
  await requirePageSession("/");
  return <HomePage />;
}
