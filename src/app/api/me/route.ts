import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  authErrorResponse,
  getSessionProfile,
  type SessionProfile,
} from "@/lib/auth/session";
import { withAuth } from "@/lib/api/with-auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const patchSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
});

export async function GET() {
  try {
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  return withAuth(null, async (user) => {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Name must be between 1 and 120 characters." },
        { status: 400 },
      );
    }

    const full_name = parsed.data.full_name;

    if (!isSupabaseConfigured()) {
      const profile: SessionProfile = {
        id: user.id,
        email: user.email ?? null,
        full_name,
        avatar_url: null,
        role: user.role,
      };
      return NextResponse.json({ profile });
    }

    const supabase = await createClient();

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: { full_name },
    });
    if (authUpdateError) {
      return NextResponse.json(
        { error: authUpdateError.message },
        { status: 400 },
      );
    }

    const { data: updated, error: profileError } = await supabase
      .from("profiles")
      .update({ full_name })
      .eq("id", user.id)
      .select("id, email, full_name, avatar_url, role")
      .single();

    if (profileError) {
      const lower = profileError.message.toLowerCase();
      if (
        lower.includes("infinite recursion detected in policy") &&
        lower.includes("profiles")
      ) {
        return NextResponse.json(
          {
            error:
              "Profile updates are blocked by a Supabase RLS policy loop on profiles. Fix the policy, then try again.",
          },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 },
      );
    }

    const profile: SessionProfile = {
      id: updated.id,
      email: updated.email,
      full_name: updated.full_name,
      avatar_url: updated.avatar_url,
      role: updated.role as SessionProfile["role"],
    };

    return NextResponse.json({ profile });
  });
}
