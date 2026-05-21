/**
 * Upload catalog images to R2 (or public/library) and write src/data/library/templates.json.
 * Run: npm run library:sync
 */
import fs from "node:fs";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readImageDimensions } from "./read-image-dimensions";

const ROOT = process.cwd();
const CATALOG_DIR = path.join(ROOT, "catalog");
const MANIFEST_PATH = path.join(CATALOG_DIR, "manifest.json");
const OUT_PATH = path.join(ROOT, "src/data/library/templates.json");
const PUBLIC_LIBRARY_DIR = path.join(ROOT, "public/library");

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);

type ManifestFile = { category?: string };
type CatalogManifest = {
  categories: { id: string; label: string }[];
  files?: Record<string, ManifestFile>;
};

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
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

function slugFromFilename(filename: string): string {
  const base = path.basename(filename, path.extname(filename));
  return (
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "template"
  );
}

function mediaTypeForExt(ext: string): string {
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

function libraryObjectKey(templateId: string, ext: string): string {
  const normalized = ext.replace(".", "");
  const map: Record<string, string> = {
    png: "png",
    jpg: "jpg",
    jpeg: "jpg",
    webp: "webp",
  };
  return `library/templates/${templateId}.${map[normalized] ?? "png"}`;
}

function loadManifest(): CatalogManifest {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return {
      categories: [
        { id: "all", label: "All" },
        { id: "general", label: "General" },
      ],
      files: {},
    };
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")) as CatalogManifest;
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

async function main() {
  if (!fs.existsSync(CATALOG_DIR)) {
    console.error("catalog/ folder not found");
    process.exit(1);
  }

  const manifest = loadManifest();
  const r2 = getR2Config();
  const usedIds = new Set<string>();

  const entries = fs
    .readdirSync(CATALOG_DIR)
    .filter((name) => IMAGE_EXT.has(path.extname(name).toLowerCase()))
    .sort();

  if (entries.length === 0) {
    console.error("No images found in catalog/");
    process.exit(1);
  }

  if (!r2) {
    fs.mkdirSync(PUBLIC_LIBRARY_DIR, { recursive: true });
    console.warn("R2 not configured — copying to public/library/");
  }

  const templates: {
    id: string;
    category: string;
    imageUrl: string;
    storageKey?: string;
    width: number;
    height: number;
  }[] = [];

  for (const filename of entries) {
    const ext = path.extname(filename).toLowerCase();
    let id = slugFromFilename(filename);
    if (usedIds.has(id)) {
      let n = 2;
      while (usedIds.has(`${id}-${n}`)) n++;
      id = `${id}-${n}`;
    }
    usedIds.add(id);

    const filePath = path.join(CATALOG_DIR, filename);
    const body = fs.readFileSync(filePath);
    const dims = readImageDimensions(filePath) ?? { width: 4, height: 5 };
    const contentType = mediaTypeForExt(ext);
    const fileMeta = manifest.files?.[filename];
    const category = fileMeta?.category?.trim() || "general";

    let imageUrl: string;
    let storageKey: string | undefined;

    if (r2) {
      storageKey = libraryObjectKey(id, ext);
      imageUrl = await uploadToR2(r2, storageKey, body, contentType);
      console.log(`↑ R2 ${filename} → ${storageKey}`);
    } else {
      const outName = `${id}${ext}`;
      fs.copyFileSync(filePath, path.join(PUBLIC_LIBRARY_DIR, outName));
      imageUrl = `/library/${outName}`;
      console.log(`→ public ${outName}`);
    }

    templates.push({
      id,
      category,
      imageUrl,
      width: dims.width,
      height: dims.height,
      ...(storageKey ? { storageKey } : {}),
    });
  }

  const out = {
    categories: manifest.categories,
    templates,
  };
  fs.writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(`\nWrote ${templates.length} templates to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
