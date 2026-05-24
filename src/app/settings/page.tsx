import { SettingsPageContent } from "@/components/settings/settings-page-content";
import { requirePageSession } from "@/lib/auth/require-page-session";

export default async function SettingsPage() {
  await requirePageSession("/settings");
  return <SettingsPageContent />;
}
