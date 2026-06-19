/**
 * Pushes OTP-only auth email templates to Supabase (no magic links).
 *
 * Supabase sends a clickable link when a template contains {{ .ConfirmationURL }}.
 * Our login UI expects a 6-digit code ({{ .Token }}), so all auth templates must
 * use Token only.
 *
 * Run:
 *   npm run auth:templates:sync
 *
 * Requires in .env.local:
 *   SUPABASE_ACCESS_TOKEN — https://supabase.com/dashboard/account/tokens
 *   NEXT_PUBLIC_SUPABASE_URL — e.g. https://abcdefgh.supabase.co
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TEMPLATES_DIR = path.join(ROOT, "docs/supabase-email-templates");

const TEMPLATE_FILES = [
  {
    file: "magic-link.html",
    subjectKey: "mailer_subjects_magic_link",
    contentKey: "mailer_templates_magic_link_content",
    subject: "Your Identiq verification code",
  },
  {
    file: "confirm-signup.html",
    subjectKey: "mailer_subjects_confirmation",
    contentKey: "mailer_templates_confirmation_content",
    subject: "Confirm your Identiq email",
  },
  {
    file: "recovery.html",
    subjectKey: "mailer_subjects_recovery",
    contentKey: "mailer_templates_recovery_content",
    subject: "Your Identiq password reset code",
  },
] as const;

function projectRefFromSupabaseUrl(url: string): string {
  const host = new URL(url).hostname;
  const ref = host.split(".")[0];
  if (!ref) {
    throw new Error(`Could not parse project ref from NEXT_PUBLIC_SUPABASE_URL: ${url}`);
  }
  return ref;
}

function assertOtpOnlyTemplate(content: string, file: string): void {
  if (content.includes("ConfirmationURL")) {
    throw new Error(
      `${file} must not include ConfirmationURL — that sends magic links instead of codes.`,
    );
  }
  if (!content.includes("{{ .Token }}")) {
    throw new Error(`${file} must include {{ .Token }} for 6-digit OTP emails.`);
  }
}

async function main(): Promise<void> {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!accessToken) {
    throw new Error(
      "Missing SUPABASE_ACCESS_TOKEN. Create one at https://supabase.com/dashboard/account/tokens",
    );
  }
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  const projectRef = projectRefFromSupabaseUrl(supabaseUrl);
  const payload: Record<string, string> = {};

  for (const entry of TEMPLATE_FILES) {
    const filePath = path.join(TEMPLATES_DIR, entry.file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Template file not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, "utf8");
    assertOtpOnlyTemplate(content, entry.file);
    payload[entry.subjectKey] = entry.subject;
    payload[entry.contentKey] = content;
  }

  const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Supabase template sync failed (${response.status}): ${body.slice(0, 500)}`,
    );
  }

  console.log(
    `Synced ${TEMPLATE_FILES.length} OTP email templates to project ${projectRef}.`,
  );
  console.log("Templates: magic link (sign-in OTP), confirm signup, recovery.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
