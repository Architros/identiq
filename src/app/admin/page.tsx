import { redirect } from "next/navigation";
import { requirePageSession } from "@/lib/auth/require-page-session";
import { ROLES } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

export default async function AdminPage() {
  await requirePageSession("/admin");
  try {
    await requireRole(ROLES.ADMIN);
  } catch {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl font-normal text-foreground">Admin</h1>
      <p className="mt-2 text-sm text-muted">
        Admin tools will live here. Your account has the admin role.
      </p>
    </div>
  );
}
