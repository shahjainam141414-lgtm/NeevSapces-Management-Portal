export type CloudinaryUploadResult = {
  url: string;
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
};

/**
 * Unsigned upload to Cloudinary (browser-safe).
 * Requires:
 *   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  (unsigned preset)
 */
export async function uploadToCloudinary(
  file: File,
  folder = "neev/banners",
): Promise<CloudinaryUploadResult> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to .env.local",
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData },
  );

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      payload?.error?.message || "Cloudinary upload failed. Check your cloud name and unsigned preset.",
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

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  );
}
