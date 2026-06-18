import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  emailSchema,
  mapOtpSendError,
  normalizeEmail,
  otpPurposeSchema,
} from "@/lib/auth/email-otp";
import { getServerSiteUrl } from "@/lib/auth/site-url";
import { createAnonClient } from "@/lib/supabase/anon";

const bodySchema = z.object({
  email: emailSchema,
  purpose: otpPurposeSchema,
});

function emailHash(email: string): string {
  return createHash("sha256").update(email).digest("hex").slice(0, 16);
}

export async function POST(request: Request) {
  let email: string;
  let purpose: z.infer<typeof otpPurposeSchema>;
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a valid email address and purpose." },
        { status: 400 },
      );
    }
    email = normalizeEmail(parsed.data.email);
    purpose = parsed.data.purpose;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const supabase = createAnonClient();

    const recoveryRedirect = `${getServerSiteUrl()}/auth/callback?next=${encodeURIComponent("/login")}`;
    const { error } =
      purpose === "recovery"
        ? await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: recoveryRedirect,
          })
        : await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: true,
            },
          });

    if (error) {
      const forwarded = request.headers.get("x-forwarded-for");
      const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
      console.warn(`[auth/otp/send] ${purpose} failed`, {
        email_hash: emailHash(email),
        ip,
        message: error.message,
      });
      const mapped = mapOtpSendError(error.message, purpose);
      return NextResponse.json({ error: mapped.error }, { status: mapped.status });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/otp/send] unexpected error:", err);
    return NextResponse.json({ ok: true });
  }
}
