import { mapWithConcurrency } from "@/lib/upload-utils";

export type CloudinaryUploadResult = {
  url: string;
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
};

export type CompressImageOptions = {
  /** Longest edge in px. Defaults to 1920 (hero / cover ready). */
  maxEdge?: number;
  /** 0–1 WebP/JPEG quality. Defaults to 0.8. */
  quality?: number;
};

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/heic",
  "image/heif",
]);

function canCompressClientSide(file: File): boolean {
  if (!file.type || !IMAGE_TYPES.has(file.type.toLowerCase())) return false;
  // Animated GIF / SVG must stay as-is
  if (file.type === "image/gif" || file.type === "image/svg+xml") return false;
  return true;
}

/**
 * Downscale + convert to WebP (JPEG fallback) before upload.
 * Cuts multi‑MB phone photos to ~150–400KB so Cloudinary finishes much faster.
 */
export async function compressImageForUpload(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  if (!canCompressClientSide(file)) return file;

  const maxEdge = options.maxEdge ?? 1920;
  const quality = options.quality ?? 0.8;

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const { width, height } = bitmap;
    if (!width || !height) return file;

    const scale = Math.min(1, maxEdge / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    // Already small file and no resize needed — skip re-encode cost
    if (scale === 1 && file.size <= 350_000) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, targetW, targetH);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", quality);
    });

    // Safari / older: WebP may fail — fall back to JPEG
    const outBlob =
      blob ??
      (await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
      }));

    if (!outBlob) return file;

    // If compression somehow grew the file, keep the original
    if (outBlob.size >= file.size && scale === 1) return file;

    const ext = outBlob.type === "image/webp" ? "webp" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([outBlob], `${base}.${ext}`, {
      type: outBlob.type,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}

/**
 * Unsigned upload to Cloudinary (browser-safe).
 * Images are compressed client-side first to keep uploads fast.
 * Requires:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  (unsigned preset)
 */
export async function uploadToCloudinary(
  file: File,
  folder = "neev/banners",
  resourceType: "image" | "raw" | "auto" = "image",
  compressOptions?: CompressImageOptions,
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to .env.local",
    );
  }

  const uploadFile =
    resourceType === "image"
      ? await compressImageForUpload(file, compressOptions)
      : file;

  const formData = new FormData();
  formData.append("file", uploadFile);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: "POST", body: formData },
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        "Cloudinary upload failed. Check your cloud name and unsigned preset.",
    );
  }

  return {
    url: payload.url,
    secure_url: payload.secure_url,
    public_id: payload.public_id,
    width: payload.width,
    height: payload.height,
  };
}

/** Parallel Cloudinary uploads with client-side compression (default: 4 at a time). */
export async function uploadManyToCloudinary(
  files: readonly File[],
  folder: string,
  options?: CompressImageOptions & { concurrency?: number },
): Promise<CloudinaryUploadResult[]> {
  const { concurrency = 4, ...compressOptions } = options ?? {};
  return mapWithConcurrency(files, concurrency, (file) =>
    uploadToCloudinary(file, folder, "image", compressOptions),
  );
}

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  );
}
