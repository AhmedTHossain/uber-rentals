import "server-only";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { reportError } from "./observability";

/**
 * File storage behind a small driver interface.
 *  - STORAGE_DRIVER=local (default): writes to STORAGE_DIR, served from
 *    STORAGE_PUBLIC_PREFIX. Fine for local dev; NOT durable on serverless.
 *  - STORAGE_DRIVER=r2: Cloudflare R2 (S3-compatible). Production target.
 *
 * Files are validated by real magic-bytes (not the client-declared mime) and
 * stored under a random key. The returned value is a stable public URL.
 *
 * NOTE (PII follow-up): license/insurance scans are sensitive. For R2 these
 * should live in a PRIVATE bucket served via short-lived signed URLs or an
 * auth'd proxy route — wire that alongside renter accounts (Phase 1/2). Public
 * bucket base below is appropriate for vehicle photos.
 */

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

type Detected = { ext: string; mime: string };

// Sniff the file signature; returns null for unsupported/again-untrusted input.
function sniff(buf: Buffer): Detected | null {
  const b = buf;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { ext: ".jpg", mime: "image/jpeg" };
  }
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return { ext: ".png", mime: "image/png" };
  }
  if (b.length >= 6 && b.toString("ascii", 0, 4) === "GIF8") {
    return { ext: ".gif", mime: "image/gif" };
  }
  if (b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    return { ext: ".webp", mime: "image/webp" };
  }
  if (b.length >= 12 && b.toString("ascii", 4, 8) === "ftyp") {
    const brand = b.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return { ext: ".avif", mime: "image/avif" };
  }
  return null;
}

export type SaveResult = { url: string } | { error: string };

interface StorageDriver {
  save(key: string, body: Buffer, contentType: string): Promise<string>;
}

// ---- local disk driver ----
const localDriver: StorageDriver = {
  async save(key, body) {
    const dir = path.resolve(process.env.STORAGE_DIR || "./public/uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, key), body);
    const prefix = process.env.STORAGE_PUBLIC_PREFIX || "/uploads";
    return `${prefix}/${key}`;
  },
};

// ---- Cloudflare R2 driver (S3-compatible) ----
let r2Client: import("@aws-sdk/client-s3").S3Client | null = null;
const r2Driver: StorageDriver = {
  async save(key, body, contentType) {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const accountId = requireEnv("R2_ACCOUNT_ID");
    const bucket = requireEnv("R2_BUCKET");
    const publicBase = requireEnv("R2_PUBLIC_BASE").replace(/\/$/, "");
    r2Client ??= new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      },
    });
    await r2Client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
    );
    return `${publicBase}/${key}`;
  },
};

// ---- Supabase Storage driver (REST, no extra packages) ----
const supabaseDriver: StorageDriver = {
  async save(key, body, contentType) {
    const url = requireEnv("SUPABASE_URL");
    const bucket = requireEnv("SUPABASE_STORAGE_BUCKET");
    const token = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const endpoint = `${url}/storage/v1/object/${bucket}/${key}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.status.toString());
      throw new Error(`Supabase Storage upload failed: ${res.status} ${text}`);
    }
    return `${url}/storage/v1/object/public/${bucket}/${key}`;
  },
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function driver(): StorageDriver {
  const d = process.env.STORAGE_DRIVER || "local";
  if (d === "r2") return r2Driver;
  if (d === "supabase") return supabaseDriver;
  return localDriver;
}

export async function saveUpload(file: File): Promise<SaveResult> {
  if (!file || typeof file.arrayBuffer !== "function") {
    return { error: "No file provided." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "File exceeds 10 MB limit." };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = sniff(buffer);
  if (!detected) {
    return { error: "Unsupported or invalid image file." };
  }
  const key = `${randomUUID()}${detected.ext}`;
  try {
    const url = await driver().save(key, buffer, detected.mime);
    return { url };
  } catch (err) {
    reportError(err, { where: "storage.save", driver: process.env.STORAGE_DRIVER || "local" });
    return { error: "Upload failed. Please try again." };
  }
}
