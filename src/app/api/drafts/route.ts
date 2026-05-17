import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api/with-auth";
import {
  deleteDraftForUser,
  listDraftsForUser,
  upsertDraft,
} from "@/lib/db/repositories/drafts";
import type { BrandProjectDraft } from "@/lib/brand/brand-project-draft";

const upsertSchema = z.object({
  draft: z.custom<BrandProjectDraft>(),
});

const deleteSchema = z.object({
  draftId: z.string().min(1),
});

export async function GET() {
  return withAuth(null, async (user) => {
    const drafts = await listDraftsForUser(user.id);
    return NextResponse.json({ drafts });
  });
}

export async function POST(request: Request) {
  return withAuth(null, async (user) => {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = upsertSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
    }

    await upsertDraft(user.id, parsed.data.draft);
    return NextResponse.json({ ok: true });
  });
}

export async function DELETE(request: Request) {
  return withAuth("brand:create", async (user) => {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = deleteSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await deleteDraftForUser(user.id, parsed.data.draftId);
    return NextResponse.json({ ok: true });
  });
}
