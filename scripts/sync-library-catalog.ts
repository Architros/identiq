/**
 * Ingests image assets from "Brand Assets Posts/" into library templates catalog.
 * - Uploads to R2 (or copies to public/library when R2 is not configured)
 * - Maps folder names to UI categories
 * - Generates clean template titles
 * - Dedupes by fingerprint/storage key/id/image URL
 *
 * Run:
 *   npm run library:sync:brand-assets
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readImageDimensions } from "./read-image-dimensions";

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, "Brand Assets Posts");
const OUT_PATH = path.join(ROOT, "src/data/library/templates.json");
const PUBLIC_LIBRARY_DIR = path.join(ROOT, "public/library");
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const FETCH_TIMEOUT_MS = 10_000;

type LibraryCategory = { id: string; label: string };
type LibraryTemplate = {
  id: string;
  category: string;
  title?: string;
  imageUrl: string;
  storageKey?: string;
  sourceFolder?: string;
  fingerprint?: string;
  width?: number;
  height?: number;
};
type LibraryCatalogData = { categories: LibraryCategory[]; templates: LibraryTemplate[] };

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
};

const FOLDER_CATEGORY_MAP: Record<string, { id: string; label: string }> = {
  ads: { id: "ads", label: "Ads" },
  apparels: { id: "apparel", label: "Apparel" },
  billboards: { id: "billboards", label: "Billboards" },
  "color-palette-presentation": {
    id: "brand-guidelines",
    label: "Brand Guidelines",
  },
  "feature-post": { id: "feature-posts", label: "Feature Posts" },
  flyers: { id: "flyers", label: "Flyers" },
  logos: { id: "logos", label: "Logos" },
  merch: { id: "merch", label: "Merch" },
  mockups: { id: "mockups", label: "Mockups" },
  presentations: { id: "presentations", label: "Presentations" },
  "saas-intro-post": { id: "saas-intro", label: "SaaS Intro Posts" },
  "sample-brand": { id: "sample-brand", label: "Sample Brand" },
  "social-media-post": { id: "social-posts", label: "Social Posts" },
  workflows: { id: "workflows", label: "Workflows" },
  "x-banners": { id: "x-banners", label: "X Banners" },
  "x-post": { id: "x-posts", label: "X Posts" },
  "youtube-covers": { id: "youtube-covers", label: "YouTube Covers" },
};

function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName ||
    !publicBaseUrl
  ) {
    return null;
  }
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBaseUrl: publicBaseUrl.replace(/\/$/, ""),
  };
}

function normalizeExt(ext: string): "png" | "jpg" | "webp" {
  const clean = ext.replace(".", "").toLowerCase();
  if (clean === "jpg" || clean === "jpeg") return "jpg";
  if (clean === "webp") return "webp";
  return "png";
}

function mediaTypeForExt(ext: string): string {
  const normalized = normalizeExt(ext);
  if (normalized === "jpg") return "image/jpeg";
  if (normalized === "webp") return "image/webp";
  return "image/png";
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "template"
  );
}

function titleCaseFromSlug(input: string): string {
  return slugify(input)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function titleFromPath(relativePath: string): string {
  const base = path.basename(relativePath, path.extname(relativePath));
  const clean = base.replace(/\b(copy|final|edit)\b/gi, "").trim();
  return titleCaseFromSlug(clean || base);
}

function fingerprintFromBuffer(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function templateId(categoryId: string, title: string, fingerprint: string): string {
  const base = slugify(title).slice(0, 48);
  return `${categoryId}-${base}-${fingerprint.slice(0, 12)}`;
}

function libraryObjectKey(id: string, ext: string): string {
  return `library/templates/${id}.${normalizeExt(ext)}`;
}

function listImageFiles(dir: string): string[] {
  const out: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listImageFiles(abs));
      continue;
    }
    if (!entry.isFile()) continue;
    if (!IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) continue;
    out.push(abs);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function loadExistingCatalog(): LibraryCatalogData {
  if (!fs.existsSync(OUT_PATH)) {
    return {
      categories: [{ id: "all", label: "All" }, { id: "general", label: "General" }],
      templates: [],
    };
  }
  return JSON.parse(fs.readFileSync(OUT_PATH, "utf8")) as LibraryCatalogData;
}

function resolveCategoryFromRelativePath(relativePath: string): {
  sourceFolder: string;
  category: LibraryCategory;
} {
  const first = relativePath.split(path.sep)[0]?.trim() || "general";
  const folderSlug = slugify(first);
  const mapped = FOLDER_CATEGORY_MAP[folderSlug];
  if (mapped) {
    return { sourceFolder: first, category: mapped };
  }
  return {
    sourceFolder: first,
    category: {
      id: folderSlug || "general",
      label: titleCaseFromSlug(folderSlug || "general"),
    },
  };
}

async function uploadToR2(
  config: R2Config,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${config.publicBaseUrl}/${key}`;
}

async function fingerprintFromRemoteUrl(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return null;
    return fingerprintFromBuffer(buf);
  } catch {
    return null;
  }
}

async function hydrateExistingFingerprints(
  templates: LibraryTemplate[],
): Promise<LibraryTemplate[]> {
  const out: LibraryTemplate[] = [];
  for (const template of templates) {
    if (template.fingerprint) {
      out.push(template);
      continue;
    }
    const remote = await fingerprintFromRemoteUrl(template.imageUrl);
    out.push(remote ? { ...template, fingerprint: remote } : template);
  }
  return out;
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source folder not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const r2 = getR2Config();
  if (!r2) {
    fs.mkdirSync(PUBLIC_LIBRARY_DIR, { recursive: true });
    console.warn("R2 not configured — copying files to public/library/");
  }

  const existing = loadExistingCatalog();
  const hydratedExisting = await hydrateExistingFingerprints(existing.templates);

  const categories = new Map<string, string>([["all", "All"]]);
  for (const c of existing.categories) categories.set(c.id, c.label);
  for (const mapped of Object.values(FOLDER_CATEGORY_MAP)) {
    categories.set(mapped.id, mapped.label);
  }

  const seenIds = new Set<string>();
  const seenImageUrls = new Set<string>();
  const seenStorageKeys = new Set<string>();
  const seenFingerprints = new Set<string>();

  const outputTemplates: LibraryTemplate[] = [];
  for (const template of hydratedExisting) {
    outputTemplates.push(template);
    seenIds.add(template.id);
    seenImageUrls.add(template.imageUrl);
    if (template.storageKey) seenStorageKeys.add(template.storageKey);
    if (template.fingerprint) seenFingerprints.add(template.fingerprint);
  }

  const files = listImageFiles(SOURCE_DIR);
  if (files.length === 0) {
    console.error("No images found in Brand Assets Posts/");
    process.exit(1);
  }

  let added = 0;
  let skipped = 0;
  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    const relative = path.relative(SOURCE_DIR, filePath);
    const buffer = fs.readFileSync(filePath);
    const fingerprint = fingerprintFromBuffer(buffer);

    if (seenFingerprints.has(fingerprint)) {
      skipped++;
      continue;
    }

    const { sourceFolder, category } = resolveCategoryFromRelativePath(relative);
    categories.set(category.id, category.label);

    const title = titleFromPath(relative);
    let id = templateId(category.id, title, fingerprint);
    let idSuffix = 2;
    while (seenIds.has(id)) {
      id = `${templateId(category.id, title, fingerprint)}-${idSuffix++}`;
    }
    const storageKey = libraryObjectKey(id, ext);
    if (seenStorageKeys.has(storageKey)) {
      skipped++;
      continue;
    }

    let imageUrl: string;
    if (r2) {
      imageUrl = await uploadToR2(r2, storageKey, buffer, mediaTypeForExt(ext));
      console.log(`↑ R2 ${relative} -> ${storageKey}`);
    } else {
      const outName = `${id}.${normalizeExt(ext)}`;
      const outPath = path.join(PUBLIC_LIBRARY_DIR, outName);
      fs.copyFileSync(filePath, outPath);
      imageUrl = `/library/${outName}`;
      console.log(`→ public ${relative} -> ${outName}`);
    }

    if (seenImageUrls.has(imageUrl)) {
      skipped++;
      continue;
    }

    const dims = readImageDimensions(filePath) ?? { width: 4, height: 5 };
    const template: LibraryTemplate = {
      id,
      category: category.id,
      title,
      imageUrl,
      storageKey,
      sourceFolder,
      fingerprint,
      width: dims.width,
      height: dims.height,
    };

    outputTemplates.push(template);
    seenIds.add(template.id);
    seenImageUrls.add(template.imageUrl);
    seenStorageKeys.add(storageKey);
    seenFingerprints.add(fingerprint);
    added++;
  }

  const outCategories: LibraryCategory[] = Array.from(categories.entries())
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => {
      if (a.id === "all") return -1;
      if (b.id === "all") return 1;
      return a.label.localeCompare(b.label);
    });

  const output: LibraryCatalogData = {
    categories: outCategories,
    templates: outputTemplates,
  };

  fs.writeFileSync(OUT_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${outputTemplates.length} templates to ${OUT_PATH}`);
  console.log(`Added ${added} new template(s), skipped ${skipped} duplicates.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
