"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/app-url";
import type { AdminProfile } from "@/lib/admin-profiles";

export type InviteUserInput = {
  name: string;
  email: string;
  phone?: string;
  photoUrl?: string | null;
};

export type InviteUserResult =
  | {
      ok: true;
      profile: AdminProfile;
      emailSent: boolean;
      message: string;
      inviteLink?: string;
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
  },
) {
  const { data: profile, error: profileError } = await admin
    .from("admin_profiles")
    .upsert(
      {
        ...row,
        role: "Super Admin",
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

  return "Email provider/SMTP failed. Check Supabase Auth → SMTP sender matches your verified Resend domain.";
}

async function createUserWithManualInviteLink(
  admin: ReturnType<typeof createServiceClient>,
  args: {
    name: string;
    email: string;
    phone: string | null;
    photoUrl: string | null;
    redirectTo: string;
    reason?: string;
  },
): Promise<InviteUserResult> {
  const { name, email, phone, photoUrl, redirectTo, reason } = args;

  let userId: string | null = null;
  const existing = await findAuthUserByEmail(admin, email);
  if (existing) {
    userId = existing.id;
  } else {
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: {
          name,
          phone,
          photo_url: photoUrl,
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
  }

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo,
        data: {
          name,
          phone,
          photo_url: photoUrl,
        },
      },
    });

  const profile = await upsertProfile(admin, {
    id: userId,
    name,
    email,
    phone,
    photo_url: photoUrl,
  });

  const inviteLink = linkData?.properties?.action_link;

  if (linkError || !inviteLink) {
    return {
      ok: true,
      profile,
      emailSent: false,
      message:
        reason ||
        "User was created in the allowlist, but invite email/link failed. Check Supabase SMTP (sender must be @neevspaces.net) and Resend logs.",
    };
  }

  return {
    ok: true,
    profile,
    emailSent: false,
    inviteLink,
    message:
      reason ||
      "Invite email could not be sent (SMTP/Resend). User was created — copy the invite link and share it manually.",
  };
}

/**
 * Invite-only Super Admin:
 * - New email → Supabase invite email + admin_profiles
 * - Rate limited → create user + return copyable invite link (no email)
 * - Already in auth → allowlist only
 */
export async function inviteAdminUser(
  input: InviteUserInput,
): Promise<InviteUserResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  const photoUrl = input.photoUrl ?? null;

  if (name.length < 2) return { ok: false, error: "Name is required." };
  if (!email.includes("@")) return { ok: false, error: "Valid email is required." };

  try {
    const admin = createServiceClient();
    const appUrl = getAppUrl();
    const redirectTo = `${appUrl}/set-password`;

    const { data: existingProfile } = await admin
      .from("admin_profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      return {
        ok: false,
        error: "This email is already an invited Super Admin.",
      };
    }

    const existingAuthUser = await findAuthUserByEmail(admin, email);

    if (existingAuthUser) {
      const profile = await upsertProfile(admin, {
        id: existingAuthUser.id,
        name,
        email,
        phone,
        photo_url: photoUrl,
      });

      return {
        ok: true,
        profile,
        emailSent: false,
        message:
          "User added to allowlist. They already have an account (e.g. Google) — no welcome email was sent. They can sign in now.",
      };
    }

    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          name,
          phone,
          photo_url: photoUrl,
        },
        redirectTo,
      });

    if (inviteError) {
      const formatted = await formatAuthError(inviteError);
      const msg = formatted.toLowerCase();

      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists")
      ) {
        const again = await findAuthUserByEmail(admin, email);
        if (again) {
          const profile = await upsertProfile(admin, {
            id: again.id,
            name,
            email,
            phone,
            photo_url: photoUrl,
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

      // Rate limit / empty SMTP errors / provider failures → still create + copyable link
      const looksLikeMailFailure =
        msg.includes("rate limit") ||
        msg.includes("rate_limit") ||
        msg.includes("smtp") ||
        msg.includes("email") ||
        msg.includes("mail") ||
        msg.includes("status 500") ||
        msg.includes("auth error") ||
        msg === "{}" ||
        !formatted.trim() ||
        formatted === "{}";

      if (looksLikeMailFailure) {
        return createUserWithManualInviteLink(admin, {
          name,
          email,
          phone,
          photoUrl,
          redirectTo,
          reason: `Invite email failed (${formatted}). User was created — copy the invite link below. Fix Supabase SMTP sender to an @neevspaces.net address (Resend verified).`,
        });
      }

      return {
        ok: false,
        error: `Invite failed: ${formatted}`,
      };
    }

    const userId = invited.user?.id;
    if (!userId) {
      return { ok: false, error: "Invite created but user id was missing." };
    }

    const profile = await upsertProfile(admin, {
      id: userId,
      name,
      email,
      phone,
      photo_url: photoUrl,
    });

    return {
      ok: true,
      profile,
      emailSent: true,
      message:
        "Welcome invite email sent. They should open it, set a password, then sign in.",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to invite user.";
    return { ok: false, error: message };
  }
}

export async function listAdminProfiles(): Promise<
  { ok: true; profiles: AdminProfile[] } | { ok: false; error: string }
> {
  try {
    const admin = createServiceClient();
    const { data, error } = await admin
      .from("admin_profiles")
      .select(
        "id, name, email, phone, photo_url, role, status, created_at, updated_at",
      )
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
    const admin = createServiceClient();
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
