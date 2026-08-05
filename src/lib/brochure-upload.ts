/**
 * Upload a property brochure to Supabase Storage via the admin API.
 * Prefer this over Cloudinary for PDFs (Cloudinary free ACL blocks PDF delivery).
 */
export async function uploadBrochureToStorage(file: File): Promise<{
  secure_url: string;
  public_id: string;
  content_type?: string;
}> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/uploads/brochure", {
    method: "POST",
    body: form,
  });

  const payload = (await res.json()) as {
    secure_url?: string;
    public_id?: string;
    content_type?: string;
    error?: string;
  };

  if (!res.ok || !payload.secure_url) {
    throw new Error(payload.error || "Brochure upload failed");
  }

  return {
    secure_url: payload.secure_url,
    public_id: payload.public_id || "",
    content_type: payload.content_type,
  };
}
