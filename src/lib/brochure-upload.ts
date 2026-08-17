import { createClient } from "@/lib/supabase/client";

export const BROCHURE_BUCKET = "property-brochures";
/** Supabase bucket limit — keep PDFs under this size. */
export const BROCHURE_MAX_BYTES = 50 * 1024 * 1024;

function brochureExtension(file: File, isPdf: boolean) {
  if (isPdf) return "pdf";
  if (file.type.includes("png")) return "png";
  if (file.type.includes("webp")) return "webp";
  return "jpg";
}

function brochureObjectPath(file: File) {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const ext = brochureExtension(file, isPdf);
  const safeBase =
    file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^\w-]+/g, "_")
      .slice(0, 60) || "brochure";
  return `${Date.now()}_${safeBase}.${ext}`;
}

function formatMaxMb() {
  return `${Math.round(BROCHURE_MAX_BYTES / (1024 * 1024))}MB`;
}

/**
 * Upload a property brochure straight to Supabase Storage from the browser.
 * Skips the Next.js API route so large PDFs are not truncated by the ~10MB proxy limit.
 */
export async function uploadBrochureToStorage(file: File): Promise<{
  secure_url: string;
  public_id: string;
  content_type?: string;
}> {
  if (file.size > BROCHURE_MAX_BYTES) {
    throw new Error(`Brochure must be under ${formatMaxMb()}.`);
  }

  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const isImage = file.type.startsWith("image/");
  if (!isPdf && !isImage) {
    throw new Error("Only PDF or image brochures are allowed.");
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Please sign in again to upload brochures.");
  }

  const path = brochureObjectPath(file);
  const { error } = await supabase.storage.from(BROCHURE_BUCKET).upload(path, file, {
    contentType: isPdf ? "application/pdf" : file.type || "image/jpeg",
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    const msg = error.message || "Brochure upload failed";
    if (/bucket|not found/i.test(msg)) {
      throw new Error(
        "Brochure storage is not set up. Run supabase/migrations/031_property_brochures_storage.sql in the Supabase SQL Editor, then retry.",
      );
    }
    if (/size|limit|too large/i.test(msg)) {
      throw new Error(`Brochure exceeds storage limit (${formatMaxMb()} max).`);
    }
    if (/policy|permission|denied|unauthorized/i.test(msg)) {
      throw new Error(
        "Upload blocked by storage policy. Run migration 031 on Supabase, then retry.",
      );
    }
    throw new Error(msg);
  }

  const { data } = supabase.storage.from(BROCHURE_BUCKET).getPublicUrl(path);
  return {
    secure_url: data.publicUrl,
    public_id: path,
    content_type: isPdf ? "application/pdf" : file.type,
  };
}
