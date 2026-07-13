"use server";

import {
  createServerSupabaseClient,
  createServiceClient,
} from "@/lib/supabase/server";
import type { AdminProfile } from "@/lib/admin-profiles";

export async function getCurrentAdminProfile(): Promise<AdminProfile | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const admin = createServiceClient();
    const { data } = await admin
      .from("admin_profiles")
      .select(
        "id, name, email, phone, photo_url, role, status, created_at, updated_at",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (data) return data as AdminProfile;

    const email = (user.email ?? "").toLowerCase();
    if (email) {
      const { data: byEmail } = await admin
        .from("admin_profiles")
        .select(
          "id, name, email, phone, photo_url, role, status, created_at, updated_at",
        )
        .eq("email", email)
        .maybeSingle();
      if (byEmail) return byEmail as AdminProfile;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Set password for an invited user.
 * Password is stored ONLY in Supabase Auth (bcrypt hash in auth.users) — never in our tables.
 * Prefer Admin API so the hash is applied even if the invite cookie session is flaky.
 */
export async function setInvitedUserPassword(
  password: string,
  clientUserId?: string,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser();

    const userId = sessionUser?.id || clientUserId;
    if (!userId) {
      return {
        ok: false,
        error: "Invite session expired. Open the invite link from your email again.",
      };
    }

    const admin = createServiceClient();
    const { data: authUser, error: getError } =
      await admin.auth.admin.getUserById(userId);

    if (getError || !authUser.user?.email) {
      return {
        ok: false,
        error: "Could not find your invite account. Ask an admin to resend the invite.",
      };
    }

    const email = authUser.user.email.trim().toLowerCase();
    const meta = authUser.user.user_metadata ?? {};

    // Single source of truth: Admin API writes the bcrypt hash + confirms email
    const { error: passwordError } = await admin.auth.admin.updateUserById(
      userId,
      {
        password,
        email_confirm: true,
        user_metadata: {
          ...meta,
          name: meta.name || meta.full_name || email.split("@")[0],
        },
      },
    );

    if (passwordError) {
      return { ok: false, error: passwordError.message };
    }

    const profilePayload = {
      id: userId,
      name:
        (meta.name as string) ||
        (meta.full_name as string) ||
        email.split("@")[0] ||
        "Admin",
      email,
      phone: (meta.phone as string) ?? null,
      photo_url:
        (meta.photo_url as string) || (meta.avatar_url as string) || null,
      role: "Super Admin" as const,
      status: "active" as const,
    };

    const { error: profileError } = await admin
      .from("admin_profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (profileError?.code === "23505") {
      await admin.from("admin_profiles").delete().eq("email", email);
      const { error: insertError } = await admin
        .from("admin_profiles")
        .insert(profilePayload);
      if (insertError) {
        return { ok: false, error: insertError.message };
      }
    } else if (profileError) {
      return { ok: false, error: profileError.message };
    }

    return { ok: true, email };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to set password.",
    };
  }
}

/** Service-role allowlist check used after password/Google auth. */
export async function isAllowlistedAdmin(
  userId: string,
  email: string,
): Promise<boolean> {
  try {
    const admin = createServiceClient();
    const normalized = email.trim().toLowerCase();

    const { data: byId } = await admin
      .from("admin_profiles")
      .select("id, status")
      .eq("id", userId)
      .maybeSingle();

    if (byId?.status === "active") return true;

    if (!normalized) return false;

    const { data: byEmail } = await admin
      .from("admin_profiles")
      .select("id, status")
      .eq("email", normalized)
      .maybeSingle();

    return byEmail?.status === "active";
  } catch {
    return false;
  }
}
