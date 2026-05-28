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
    const site = getServerSiteUrl();
    const redirectTo = `${site}/auth/callback`;

    if (purpose === "signup") {
      // Supabase sends a 6-digit code when the Magic Link template uses {{ .Token }}.
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
        console.warn("[auth/otp/send] signup failed", {
          email_hash: emailHash(email),
          ip,
          message: error.message,
        });
        const mapped = mapOtpSendError(error.message);
        return NextResponse.json({ error: mapped.error }, { status: mapped.status });
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
        console.warn("[auth/otp/send] recovery failed", {
          email_hash: emailHash(email),
          ip,
          message: error.message,
        });
        const mapped = mapOtpSendError(error.message);
        return NextResponse.json({ error: mapped.error }, { status: mapped.status });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[auth/otp/send] unexpected error:", err);
    return NextResponse.json({ ok: true });
  }
}
