import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/auth/roles";
import { ROLES } from "@/lib/auth/roles";
import type { AuthUser } from "@/lib/auth/permissions";
import {
  InfrastructureError,
  isInfrastructureError,
} from "@/lib/errors/user-facing";

export type SessionProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
};

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getSessionProfile(): Promise<SessionProfile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      if (isInfrastructureError(authError)) {
        throw new InfrastructureError("Auth service unreachable", {
          cause: authError,
        });
      }
      return null;
    }
    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, role")
      .eq("id", user.id)
      .single();

    if (profileError && isInfrastructureError(profileError)) {
      throw new InfrastructureError("Profile service unreachable", {
        cause: profileError,
      });
    }

    if (!profile) {
      return {
        id: user.id,
        email: user.email ?? null,
        full_name:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          null,
        avatar_url:
          (user.user_metadata?.avatar_url as string | undefined) ??
          (user.user_metadata?.picture as string | undefined) ??
          null,
        role: ROLES.USER,
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      role: profile.role as AppRole,
    };
  } catch (error) {
    if (isInfrastructureError(error)) {
      throw error instanceof InfrastructureError
        ? error
        : new InfrastructureError("Database unreachable", { cause: error });
    }
    throw error;
  }
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const profile = await getSessionProfile();
  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
  };
}

export async function requireAuthUser(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new AuthError("Unauthorized", 401);
  }
  return user;
}

export async function requireRole(role: AppRole): Promise<AuthUser> {
  const user = await requireAuthUser();
  if (user.role !== role) {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (isInfrastructureError(error)) {
    return NextResponse.json(
      {
        error: "service_unavailable",
        message:
          "We could not reach the database. Check your network and Supabase project status, then try again.",
      },
      { status: 503 },
    );
  }
  if (error instanceof Error) {
    const message = error.message || "Request failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
