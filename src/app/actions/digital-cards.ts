"use server";

import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentAdminProfile } from "@/app/actions/auth";
import {
  CARD_COMPANY,
  DEFAULT_CARD_COVER,
  DEFAULT_CARD_ROLE,
  DEFAULT_CARD_TAGLINE,
  formatPhoneFields,
  mapsQueryFromAddress,
  slugifyName,
  splitDisplayName,
  type DigitalCard,
  type DigitalCardStatus,
} from "@/lib/digital-cards";
import { canEditUser, isUserRole } from "@/lib/roles";
import type { UserRole } from "@/lib/nav-config";

const CARD_SELECT =
  "id, admin_profile_id, slug, display_name, first_name, last_name, role_title, tagline, phone_display, phone_tel, whatsapp, email, photo_url, accent, cover_url, office_address, maps_query, rera, status, created_at, updated_at";

async function uniqueSlug(
  admin: ReturnType<typeof createServiceClient>,
  base: string,
  excludeId?: string,
) {
  const candidate = base || "advisor";
  for (let i = 0; i < 40; i += 1) {
    const trySlug = i === 0 ? candidate : `${candidate}-${i + 1}`;
    const { data } = await admin
      .from("digital_cards")
      .select("id")
      .eq("slug", trySlug)
      .maybeSingle();
    if (!data || (excludeId && data.id === excludeId)) return trySlug;
  }
  return `${candidate}-${Date.now().toString(36)}`;
}

export async function ensureDigitalCardForProfile(input: {
  adminProfileId: string;
  name: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
}): Promise<DigitalCard | null> {
  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("digital_cards")
    .select(CARD_SELECT)
    .eq("admin_profile_id", input.adminProfileId)
    .maybeSingle();

  if (existing) return existing as DigitalCard;

  const { firstName, lastName } = splitDisplayName(input.name);
  const phones = formatPhoneFields(input.phone);
  const slug = await uniqueSlug(admin, slugifyName(input.name));

  const { data, error } = await admin
    .from("digital_cards")
    .insert({
      admin_profile_id: input.adminProfileId,
      slug,
      display_name: input.name.trim(),
      first_name: firstName,
      last_name: lastName,
      role_title: DEFAULT_CARD_ROLE,
      tagline: DEFAULT_CARD_TAGLINE,
      phone_display: phones.phoneDisplay,
      phone_tel: phones.phoneTel,
      whatsapp: phones.whatsapp,
      email: input.email.trim().toLowerCase(),
      photo_url: input.photoUrl ?? null,
      accent: "steel",
      cover_url: DEFAULT_CARD_COVER,
      office_address: CARD_COMPANY.address,
      maps_query: CARD_COMPANY.mapsQuery,
      rera: CARD_COMPANY.rera,
      status: "active",
    })
    .select(CARD_SELECT)
    .single();

  if (error) {
    console.error("[digital_cards] ensure failed:", error.message);
    return null;
  }
  return data as DigitalCard;
}

export async function syncDigitalCardFromProfile(input: {
  adminProfileId: string;
  name: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
}): Promise<void> {
  const admin = createServiceClient();
  const { data: card } = await admin
    .from("digital_cards")
    .select("id")
    .eq("admin_profile_id", input.adminProfileId)
    .maybeSingle();

  if (!card) {
    await ensureDigitalCardForProfile(input);
    return;
  }

  const { firstName, lastName } = splitDisplayName(input.name);
  const phones = formatPhoneFields(input.phone);

  await admin
    .from("digital_cards")
    .update({
      display_name: input.name.trim(),
      first_name: firstName,
      last_name: lastName,
      email: input.email.trim().toLowerCase(),
      phone_display: phones.phoneDisplay || undefined,
      phone_tel: phones.phoneTel || undefined,
      whatsapp: phones.whatsapp || undefined,
      photo_url: input.photoUrl ?? null,
    })
    .eq("id", card.id);
}

export async function getDigitalCardByProfileId(
  adminProfileId: string,
): Promise<
  { ok: true; card: DigitalCard | null } | { ok: false; error: string }
> {
  try {
    const actor = await getCurrentAdminProfile();
    if (!actor) return { ok: false, error: "Not signed in." };

    const admin = createServiceClient();
    const { data, error } = await admin
      .from("digital_cards")
      .select(CARD_SELECT)
      .eq("admin_profile_id", adminProfileId)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (data) return { ok: true, card: data as DigitalCard };

    const { data: profile } = await admin
      .from("admin_profiles")
      .select("id, name, email, phone, photo_url")
      .eq("id", adminProfileId)
      .maybeSingle();

    if (!profile) return { ok: true, card: null };

    const created = await ensureDigitalCardForProfile({
      adminProfileId: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      photoUrl: profile.photo_url,
    });

    return { ok: true, card: created };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to load card.",
    };
  }
}

export type UpdateDigitalCardInput = {
  adminProfileId: string;
  displayName: string;
  roleTitle: string;
  tagline: string;
  phone?: string;
  email: string;
  photoUrl?: string | null;
  coverUrl?: string;
  status: DigitalCardStatus;
  officeAddress: string;
  rera: string;
};

export async function updateDigitalCard(
  input: UpdateDigitalCardInput,
): Promise<{ ok: true; card: DigitalCard } | { ok: false; error: string }> {
  const displayName = input.displayName.trim();
  const roleTitle = input.roleTitle.trim() || DEFAULT_CARD_ROLE;
  const tagline = input.tagline.trim() || DEFAULT_CARD_TAGLINE;
  const email = input.email.trim().toLowerCase();
  const officeAddress = input.officeAddress.trim() || CARD_COMPANY.address;
  const rera = input.rera.trim() || CARD_COMPANY.rera;

  if (displayName.length < 2) return { ok: false, error: "Name is required." };
  if (!email.includes("@")) return { ok: false, error: "Valid email is required." };
  if (input.status !== "active" && input.status !== "inactive") {
    return { ok: false, error: "Invalid status." };
  }

  try {
    const actor = await getCurrentAdminProfile();
    if (!actor) return { ok: false, error: "Not signed in." };

    const admin = createServiceClient();
    const { data: profile } = await admin
      .from("admin_profiles")
      .select("id, role")
      .eq("id", input.adminProfileId)
      .maybeSingle();

    if (!profile) return { ok: false, error: "User not found." };

    const isSelf = actor.id === profile.id;
    if (
      !canEditUser(
        actor.role,
        isUserRole(profile.role) ? (profile.role as UserRole) : "Manager",
        isSelf,
      )
    ) {
      return { ok: false, error: "You cannot edit this digital card." };
    }

    let card = (
      await admin
        .from("digital_cards")
        .select(CARD_SELECT)
        .eq("admin_profile_id", input.adminProfileId)
        .maybeSingle()
    ).data as DigitalCard | null;

    if (!card) {
      card = await ensureDigitalCardForProfile({
        adminProfileId: input.adminProfileId,
        name: displayName,
        email,
        phone: input.phone,
        photoUrl: input.photoUrl,
      });
      if (!card) return { ok: false, error: "Could not create digital card." };
    }

    const { firstName, lastName } = splitDisplayName(displayName);
    const fromPhone = formatPhoneFields(input.phone);
    const whatsapp = fromPhone.whatsapp || card.whatsapp;
    const phoneTel = fromPhone.phoneTel || card.phone_tel;
    const phoneDisplay = fromPhone.phoneDisplay || card.phone_display;

    const { data, error } = await admin
      .from("digital_cards")
      .update({
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
        role_title: roleTitle,
        tagline,
        phone_display: phoneDisplay,
        phone_tel: phoneTel,
        whatsapp,
        email,
        photo_url: input.photoUrl ?? null,
        cover_url: input.coverUrl?.trim() || card.cover_url || DEFAULT_CARD_COVER,
        office_address: officeAddress,
        maps_query: mapsQueryFromAddress(officeAddress),
        rera,
        status: input.status,
      })
      .eq("id", card.id)
      .select(CARD_SELECT)
      .single();

    if (error) return { ok: false, error: error.message };
    return { ok: true, card: data as DigitalCard };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to update card.",
    };
  }
}

/** Expose shared constants for server consumers */
export async function getCardCompanyConstants() {
  return CARD_COMPANY;
}
