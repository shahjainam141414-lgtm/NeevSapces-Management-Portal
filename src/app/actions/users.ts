"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/app-url";
import type { AdminProfile } from "@/lib/admin-profiles";
import type { UserRole } from "@/lib/nav-config";
import {
  canAssignRole,
  canDeleteUser,
  canEditUser,
  isUserRole,
} from "@/lib/roles";
import {
  isResendConfigured,
  sendInviteEmail,
} from "@/lib/email/send-invite";
import { getCurrentAdminProfile } from "@/app/actions/auth";
import {
  ensureDigitalCardForProfile,
  syncDigitalCardFromProfile,
} from "@/app/actions/digital-cards";

export type InviteUserInput = {
  name: string;
  email: string;
  phone?: string;
  photoUrl?: string | null;
  role?: UserRole;
};

export type UpdateUserInput = {
  id: string;
  name: string;
  phone?: string;
  photoUrl?: string | null;
  role: UserRole;
  status: "active" | "inactive";
};

export type InviteUserResult =
  | {
      ok: true;
      profile: AdminProfile;
      emailSent: boolean;
      message: string;
    }
  | { ok: false; error: string };

async function findAuthUserByEmail(
  admin: ReturnType<typeof createServiceClient>,
  email: string,
) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const found = data.users.find(
      (u) => (u.email ?? "").trim().toLowerCase() === email,
    );
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

async function upsertProfile(
  admin: ReturnType<typeof createServiceClient>,
  row: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    photo_url: string | null;
    role: UserRole;
  },
) {
  const { data: profile, error: profileError } = await admin
    .from("admin_profiles")
    .upsert(
      {
        ...row,
        status: "active",
      },
      { onConflict: "id" },
    )
    .select(
      "id, name, email, phone, photo_url, role, status, created_at, updated_at",
    )
    .single();

  if (profileError) throw new Error(profileError.message);
  return profile as AdminProfile;
}

async function formatAuthError(err: unknown): Promise<string> {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;

  const anyErr = err as {
    message?: unknown;
    msg?: unknown;
    error?: unknown;
    error_description?: unknown;
    code?: unknown;
    status?: unknown;
  };

  const candidates = [
    anyErr.message,
    anyErr.msg,
    anyErr.error_description,
    anyErr.error,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim() && value.trim() !== "{}") {
      return value.trim();
    }
  }

  if (typeof anyErr.code === "string" || typeof anyErr.status === "number") {
    return `Auth error${anyErr.code ? ` (${String(anyErr.code)})` : ""}${
      anyErr.status ? ` status ${String(anyErr.status)}` : ""
    }`;
  }

  try {
    const raw = JSON.stringify(err);
    if (raw && raw !== "{}") return raw;
  } catch {
    // ignore
  }

  return "Email provider/SMTP failed. Configure RESEND_API_KEY or Supabase Auth → SMTP (Resend).";
}

/**
 * Create auth user + generate password link + send email via Resend.
 * Uses a confirmed account + recovery link so set-password → sign-in works reliably.
 */
async function inviteViaResend(
  admin: ReturnType<typeof createServiceClient>,
  args: {
    name: string;
    email: string;
    phone: string | null;
    photoUrl: string | null;
    role: UserRole;
    redirectTo: string;
  },
): Promise<InviteUserResult> {
  const { name, email, phone, photoUrl, role, redirectTo } = args;
  const tempPassword = `Tmp.${crypto.randomUUID().replace(/-/g, "")}Aa1!`;

  let userId: string | null = null;
  let createdNow = false;
  const existing = await findAuthUserByEmail(admin, email);

  if (existing) {
    userId = existing.id;
    const { error: updateError } = await admin.auth.admin.updateUserById(
      existing.id,
      {
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          ...(existing.user_metadata ?? {}),
          name,
          phone,
          photo_url: photoUrl,
          role,
        },
      },
    );
    if (updateError) {
      return { ok: false, error: await formatAuthError(updateError) };
    }
  } else {
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name,
          phone,
          photo_url: photoUrl,
          role,
        },
      });

    if (createError || !created.user?.id) {
      return {
        ok: false,
        error:
          (await formatAuthError(createError)) ||
          "Could not create user. They may already exist in Authentication → Users.",
      };
    }
    userId = created.user.id;
    createdNow = true;
  }

  // Recovery link opens set-password with a session that can update the password
  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo,
      },
    });

  const inviteLink = linkData?.properties?.action_link;
  if (linkError || !inviteLink) {
    if (createdNow && userId) {
      await admin.auth.admin.deleteUser(userId);
    }
    return {
      ok: false,
      error:
        (await formatAuthError(linkError)) ||
        "Could not generate invite link. Check Supabase Auth URL configuration.",
    };
  }

  const sent = await sendInviteEmail({
    to: email,
    name,
    role,
    inviteUrl: inviteLink,
  });

  if (!sent.ok) {
    if (createdNow && userId) {
      await admin.auth.admin.deleteUser(userId);
    }
    return {
      ok: false,
      error: `Invite email failed: ${sent.error}`,
    };
  }

  const profile = await upsertProfile(admin, {
    id: userId,
    name,
    email,
    phone,
    photo_url: photoUrl,
    role,
  });

  await ensureDigitalCardForProfile({
    adminProfileId: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    photoUrl: profile.photo_url,
  });

  return {
    ok: true,
    profile,
    emailSent: true,
    message:
      "Welcome invite email sent. They should open it, set a password, then sign in.",
  };
}

/**
 * Invite-only admin user (role-aware).
 */
export async function inviteAdminUser(
  input: InviteUserInput,
): Promise<InviteUserResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  const photoUrl = input.photoUrl ?? null;
  const role: UserRole = isUserRole(input.role ?? "") ? input.role! : "Manager";

  if (name.length < 2) return { ok: false, error: "Name is required." };
  if (!email.includes("@")) return { ok: false, error: "Valid email is required." };

  try {
    const actor = await getCurrentAdminProfile();
    if (!actor) return { ok: false, error: "Not signed in." };
    if (!canAssignRole(actor.role, role)) {
      return {
        ok: false,
        error: "You cannot invite a user with a higher role (e.g. Super Admin).",
      };
    }

    const admin = createServiceClient();
    const appUrl = getAppUrl();
    const redirectTo = `${appUrl}/set-password`;

    const { data: existingProfile } = await admin
      .from("admin_profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      return { ok: false, error: "This email is already invited." };
    }

    const existingAuthUser = await findAuthUserByEmail(admin, email);

    if (existingAuthUser) {
      const profile = await upsertProfile(admin, {
        id: existingAuthUser.id,
        name,
        email,
        phone,
        photo_url: photoUrl,
        role,
      });
      await ensureDigitalCardForProfile({
        adminProfileId: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        photoUrl: profile.photo_url,
      });
      return {
        ok: true,
        profile,
        emailSent: false,
        message:
          "User added to allowlist. They already have an account (e.g. Google) — no welcome email was sent. They can sign in now.",
      };
    }

    // Prefer Resend so invites always go out from your verified domain
    if (isResendConfigured()) {
      return inviteViaResend(admin, {
        name,
        email,
        phone,
        photoUrl,
        role,
        redirectTo,
      });
    }

    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        data: { name, phone, photo_url: photoUrl, role },
        redirectTo,
      });

    if (inviteError) {
      const formatted = await formatAuthError(inviteError);
      const msg = formatted.toLowerCase();

      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        const again = await findAuthUserByEmail(admin, email);
        if (again) {
          const profile = await upsertProfile(admin, {
            id: again.id,
            name,
            email,
            phone,
            photo_url: photoUrl,
            role,
          });
          await ensureDigitalCardForProfile({
            adminProfileId: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            photoUrl: profile.photo_url,
          });
          return {
            ok: true,
            profile,
            emailSent: false,
            message:
              "User added to allowlist. Account already existed — no welcome email sent. They can sign in with Google or password.",
          };
        }
      }

      return {
        ok: false,
        error: `Invite email failed (${formatted}). Add RESEND_API_KEY to .env.local (Resend) so invites can be emailed automatically.`,
      };
    }

    const userId = invited.user?.id;
    if (!userId) return { ok: false, error: "Invite created but user id was missing." };

    const profile = await upsertProfile(admin, {
      id: userId,
      name,
      email,
      phone,
      photo_url: photoUrl,
      role,
    });

    await ensureDigitalCardForProfile({
      adminProfileId: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      photoUrl: profile.photo_url,
    });

    return {
      ok: true,
      profile,
      emailSent: true,
      message: "Welcome invite email sent. They should open it, set a password, then sign in.",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to invite user.",
    };
  }
}

export async function updateAdminUser(
  input: UpdateUserInput,
): Promise<{ ok: true; profile: AdminProfile } | { ok: false; error: string }> {
  const name = input.name.trim();
  const phone = input.phone?.trim() || null;
  const photoUrl = input.photoUrl ?? null;
  const role = input.role;
  const status = input.status;

  if (name.length < 2) return { ok: false, error: "Name is required." };
  if (!isUserRole(role)) return { ok: false, error: "Invalid role." };
  if (status !== "active" && status !== "inactive") {
    return { ok: false, error: "Invalid status." };
  }

  try {
    const actor = await getCurrentAdminProfile();
    if (!actor) return { ok: false, error: "Not signed in." };

    const admin = createServiceClient();
    const { data: target, error: targetError } = await admin
      .from("admin_profiles")
      .select("id, name, email, phone, photo_url, role, status, created_at, updated_at")
      .eq("id", input.id)
      .maybeSingle();

    if (targetError || !target) return { ok: false, error: "User not found." };

    const isSelf = actor.id === target.id;
    if (!canEditUser(actor.role, target.role, isSelf)) {
      return {
        ok: false,
        error:
          target.role === "Super Admin"
            ? "Managers cannot edit Super Admin users."
            : "You cannot edit this user.",
      };
    }

    const nextRole = isSelf ? (target.role as UserRole) : role;
    const nextStatus = isSelf ? (target.status as "active" | "inactive") : status;

    if (!isSelf && !canAssignRole(actor.role, nextRole)) {
      return {
        ok: false,
        error: "You cannot assign a role higher than your own (e.g. Super Admin).",
      };
    }

    const { data: profile, error } = await admin
      .from("admin_profiles")
      .update({
        name,
        phone,
        photo_url: photoUrl,
        role: nextRole,
        status: nextStatus,
      })
      .eq("id", input.id)
      .select("id, name, email, phone, photo_url, role, status, created_at, updated_at")
      .single();

    if (error) return { ok: false, error: error.message };

    const updated = profile as AdminProfile;
    await syncDigitalCardFromProfile({
      adminProfileId: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      photoUrl: updated.photo_url,
    });

    return { ok: true, profile: updated };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update user.",
    };
  }
}

export async function listAdminProfiles(): Promise<
  { ok: true; profiles: AdminProfile[] } | { ok: false; error: string }
> {
  try {
    const admin = createServiceClient();
    const { data, error } = await admin
      .from("admin_profiles")
      .select("id, name, email, phone, photo_url, role, status, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) return { ok: false, error: error.message };
    return { ok: true, profiles: (data ?? []) as AdminProfile[] };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load users.",
    };
  }
}

export async function deleteAdminUser(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const actor = await getCurrentAdminProfile();
    if (!actor) return { ok: false, error: "Not signed in." };

    if (actor.id === userId) {
      return { ok: false, error: "You cannot delete your own account." };
    }

    const admin = createServiceClient();
    const { data: target } = await admin
      .from("admin_profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();

    if (!target) return { ok: false, error: "User not found." };

    if (!canDeleteUser(actor.role, target.role, false)) {
      return {
        ok: false,
        error:
          target.role === "Super Admin"
            ? "Managers cannot delete Super Admin users."
            : "You cannot delete a user with an equal or higher role.",
      };
    }

    await admin.from("admin_profiles").delete().eq("id", userId);
    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError) return { ok: false, error: authError.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to delete user.",
    };
  }
}

export async function signOutAction(): Promise<void> {
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
}
