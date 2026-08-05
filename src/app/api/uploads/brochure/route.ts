import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createServiceClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

const BUCKET = "property-brochures";
const MAX_BYTES = 20 * 1024 * 1024; // 20MB

async function ensureBrochureBucket() {
  const supabase = createServiceClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;

  const exists = buckets?.some((b) => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
  return supabase;
}

/**
 * Uploads property brochures to Supabase Storage (public).
 * Cloudinary free plans block PDF delivery (401 ACL) — Supabase avoids that.
 */
export async function POST(req: Request) {
  try {
    const sessionClient = await createServerSupabaseClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      return NextResponse.json(
        { error: "Only PDF or image brochures are allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File must be under 20MB" },
        { status: 400 },
      );
    }

    const supabase = await ensureBrochureBucket();
    const ext = isPdf
      ? "pdf"
      : file.type.includes("png")
        ? "png"
        : file.type.includes("webp")
          ? "webp"
          : "jpg";
    const safeBase =
      file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[^\w-]+/g, "_")
        .slice(0, 60) || "brochure";
    const path = `${Date.now()}_${safeBase}.${ext}`;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: isPdf ? "application/pdf" : file.type || "image/jpeg",
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message || "Upload failed" },
        { status: 500 },
      );
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({
      secure_url: data.publicUrl,
      public_id: path,
      content_type: isPdf ? "application/pdf" : file.type,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Brochure upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
