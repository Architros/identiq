import { NextResponse } from "next/server";
import { can, type PermissionAction } from "@/lib/auth/permissions";
import {
  authErrorResponse,
  AuthError,
  requireAuthUser,
} from "@/lib/auth/session";
import { deductTokens } from "@/lib/db/repositories/credits";

export async function requireApiUser(action?: PermissionAction) {
  const user = await requireAuthUser();
  if (action && !can(user, action)) {
    throw new AuthError("Forbidden", 403);
  }
  return user;
}

export async function requireApiUserResponse(action?: PermissionAction) {
  try {
    return { user: await requireApiUser(action) } as const;
  } catch (error) {
    return { response: authErrorResponse(error) } as const;
  }
}

export async function deductTokensOrResponse(params: {
  userId: string;
  amount: number;
  referenceType: string;
  referenceId: string;
  idempotencyKey: string;
}) {
  const result = await deductTokens(params);
  if (!result.success) {
    return NextResponse.json(
      {
        error: "insufficient_tokens",
        message:
          "You do not have enough tokens for this generation. Buy more tokens or reduce presets and quantity.",
        balance: result.balance,
      },
      { status: 402 },
    );
  }
  return null;
}
