import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

async function clearSessionAndReject(
  supabase: ReturnType<typeof createServerClient>,
  origin: string,
  userId: string | undefined,
  reason: "not_invited" | "auth_callback",
) {
  try {
    if (userId) {
      const admin = createServiceClient();
      // Remove uninvited Google users from auth.users
      await admin.auth.admin.deleteUser(userId);
    }
  } catch {
    // Best-effort cleanup
  }

  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/login?error=${reason}`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const type = searchParams.get("type");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  const user = data.user;
  const email = (user.email ?? "").trim().toLowerCase();
  const isInviteFlow = type === "invite" || type === "recovery";

  try {
    const admin = createServiceClient();
    const meta = user.user_metadata ?? {};

    if (isInviteFlow) {
      const metaRole = meta.role;
      const role =
        metaRole === "Manager" || metaRole === "Super Admin"
          ? metaRole
          : "Manager";

      await admin.from("admin_profiles").upsert(
        {
          id: user.id,
          name:
            meta.name ||
            meta.full_name ||
            email.split("@")[0] ||
            "Admin",
          email,
          phone: meta.phone ?? null,
          photo_url:
            meta.photo_url || meta.avatar_url || meta.picture || null,
          role,
          status: "active",
        },
        { onConflict: "id" },
      );

      return NextResponse.redirect(`${origin}/set-password`);
    }

    // Invite-only: must already be allowlisted in admin_profiles
    const { data: byId } = await admin
      .from("admin_profiles")
      .select("id, email, status, name, phone, photo_url, role")
      .eq("id", user.id)
      .maybeSingle();

    let profile = byId;

    if (!profile && email) {
      const { data: byEmail } = await admin
        .from("admin_profiles")
        .select("id, email, status, name, phone, photo_url, role")
        .eq("email", email)
        .maybeSingle();
      profile = byEmail;
    }

    if (!profile || profile.status === "inactive") {
      return clearSessionAndReject(
        supabase,
        origin,
        byId ? undefined : user.id,
        "not_invited",
      );
    }

    // Re-bind allowlist row if invite used a different auth user id than Google
    if (profile.id !== user.id) {
      const oldId = profile.id;
      await admin.from("admin_profiles").delete().eq("id", oldId);
      await admin.from("admin_profiles").insert({
        id: user.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        photo_url: meta.avatar_url || meta.picture || profile.photo_url,
        role: profile.role || "Manager",
        status: "active",
      });
      try {
        await admin.auth.admin.deleteUser(oldId);
      } catch {
        // ignore if already gone
      }
    } else {
      const updates: { photo_url?: string; name?: string } = {};
      if (meta.avatar_url || meta.picture) {
        updates.photo_url = meta.avatar_url || meta.picture;
      }
      if (meta.full_name || meta.name) {
        updates.name = meta.full_name || meta.name;
      }
      if (Object.keys(updates).length > 0) {
        await admin.from("admin_profiles").update(updates).eq("id", user.id);
      }
    }

    const safeNext = next.startsWith("/") ? next : "/dashboard";
    return NextResponse.redirect(`${origin}${safeNext}`);
  } catch {
    return clearSessionAndReject(supabase, origin, undefined, "auth_callback");
  }
}
