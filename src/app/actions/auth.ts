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
 * Uses Admin API, then verifies sign-in works before returning success.
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

    // Prefer session update (invite/recovery cookie) — this activates password login
    if (sessionUser?.id) {
      const { error: sessionPasswordError } = await supabase.auth.updateUser({
        password,
      });
      if (sessionPasswordError) {
        // Fall through to Admin API below
      }
    }

    // Ensure hash + confirmed email via Admin API (covers flaky invite cookies)
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

    // Verify the new password actually works for sign-in
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && anon) {
      const { createClient } = await import("@supabase/supabase-js");
      const verifier = createClient(url, anon, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error: verifyError } = await verifier.auth.signInWithPassword({
        email,
        password,
      });
      if (verifyError) {
        return {
          ok: false,
          error:
            "Password could not be activated for sign-in. Open a fresh invite link from your email and try again.",
        };
      }
      await verifier.auth.signOut().catch(() => undefined);
    }

    // Preserve an existing admin's role/profile on password reset —
    // never downgrade a Super Admin to Manager during recovery/invite reuse.
    const { data: existingProfile } = await admin
      .from("admin_profiles")
      .select("name, phone, photo_url, role")
      .or(`id.eq.${userId},email.eq.${email}`)
      .maybeSingle();

    const metaRole = meta.role;
    const role =
      existingProfile?.role === "Manager" ||
      existingProfile?.role === "Super Admin"
        ? existingProfile.role
        : metaRole === "Manager" || metaRole === "Super Admin"
          ? metaRole
          : "Manager";

    const profilePayload = {
      id: userId,
      name:
        existingProfile?.name ||
        (meta.name as string) ||
        (meta.full_name as string) ||
        email.split("@")[0] ||
        "Admin",
      email,
      phone: (existingProfile?.phone as string) ?? (meta.phone as string) ?? null,
      photo_url:
        (existingProfile?.photo_url as string) ||
        (meta.photo_url as string) ||
        (meta.avatar_url as string) ||
        null,
      role,
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

/**
 * Forgot-password: generate a recovery link and email it via Resend
 * (same path as welcome invites — not Supabase's default recovery template).
 *
 * Always returns a generic success to the client when the email is not in
 * the allowlist, so we don't leak which emails exist.
 */
export async function requestPasswordReset(
  rawEmail: string,
): Promise<{ ok: true; sent: boolean } | { ok: false; error: string }> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  try {
    const { getAppUrl } = await import("@/lib/app-url");
    const {
      isResendConfigured,
      sendResetPasswordEmail,
    } = await import("@/lib/email/send-invite");

    if (!isResendConfigured()) {
      return {
        ok: false,
        error:
          "Email is not configured. Add RESEND_API_KEY to .env.local (same key used for welcome invites).",
      };
    }

    const admin = createServiceClient();
    const { data: profile } = await admin
      .from("admin_profiles")
      .select("id, name, email, status")
      .eq("email", email)
      .maybeSingle();

    // Don't reveal whether the account exists
    if (!profile || profile.status !== "active") {
      return { ok: true, sent: false };
    }

    const redirectTo = `${getAppUrl()}/set-password`;
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
      });

    const resetUrl = linkData?.properties?.action_link;
    if (linkError || !resetUrl) {
      return {
        ok: false,
        error:
          linkError?.message ||
          "Could not create reset link. In Supabase → Authentication → URL Configuration, add your app URL and /set-password to Redirect URLs.",
      };
    }

    const sent = await sendResetPasswordEmail({
      to: email,
      name: profile.name,
      resetUrl,
    });

    if (!sent.ok) {
      return { ok: false, error: sent.error };
    }

    return { ok: true, sent: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Could not send reset email. Please try again.",
    };
  }
}
