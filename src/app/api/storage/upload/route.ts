import { NextResponse } from "next/server";
import { isR2Configured } from "@/lib/storage/r2-config";
import {
  brandReferenceObjectKey,
  referenceObjectKey,
} from "@/lib/storage/object-keys";
import { uploadBuffer } from "@/lib/storage/r2";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  getAttachmentKind,
} from "@/lib/brand/attachment-utils";

const ALLOWED_MIME = new Set(
  ATTACHMENT_ACCEPT.split(",")
    .map((s) => s.trim())
    .filter((s) => s.includes("/")),
);

function isAllowedFile(file: File): boolean {
  if (file.size > ATTACHMENT_MAX_BYTES) return false;
  const name = file.name.toLowerCase();
  if (file.type && ALLOWED_MIME.has(file.type)) return true;
  if (name.endsWith(".md") || name.endsWith(".txt")) return true;
  return false;
}

export async function POST(request: Request) {
  if (!isR2Configured()) {
    return NextResponse.json(
      {
        error:
          "Object storage is not configured. Add R2 credentials to your environment.",
      },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const draftId = String(formData.get("draftId") ?? "").trim();
  const brandId = String(formData.get("brandId") ?? "").trim();
  const attachmentId =
    String(formData.get("attachmentId") ?? "").trim() ||
    `ref_${crypto.randomUUID().slice(0, 8)}`;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!draftId && !brandId) {
    return NextResponse.json(
      { error: "Missing draftId or brandId" },
      { status: 400 },
    );
  }

  if (!isAllowedFile(file)) {
    return NextResponse.json(
      { error: "File type or size not allowed" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";
  const key = brandId
    ? brandReferenceObjectKey(brandId, attachmentId, file.name)
    : referenceObjectKey(draftId, attachmentId, file.name);

  try {
    const uploaded = await uploadBuffer({
      key,
      body: buffer,
      contentType,
    });

    const kind = getAttachmentKind({
      id: attachmentId,
      name: file.name,
      type: contentType,
      size: file.size,
    });

    return NextResponse.json({
      id: attachmentId,
      name: file.name,
      type: contentType,
      size: file.size,
      storageKey: uploaded.key,
      url: uploaded.url,
      previewUrl: kind === "image" ? uploaded.url : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
