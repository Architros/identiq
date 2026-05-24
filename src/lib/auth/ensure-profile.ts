import { ROLES } from "@/lib/auth/roles";
import { createServiceRoleClient } from "@/lib/supabase/server";

type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

/** Ensures public.profiles exists (safety net if DB trigger is missing). */
export async function ensureProfileForUser(user: AuthUserLike): Promise<void> {
  const admin = createServiceRoleClient();
  const meta = user.user_metadata ?? {};

  const full_name =
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    null;
  const avatar_url =
    (meta.avatar_url as string | undefined) ??
    (meta.picture as string | undefined) ??
    null;

  const { error } = await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name,
      avatar_url,
      role: ROLES.USER,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("[auth] ensureProfileForUser failed:", error.message);
    throw error;
  }
}
